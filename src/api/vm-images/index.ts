import axios from "axios";
import { runIdempotentRequest } from "@/api/idempotency";
import {
  ApiError,
  coreRequest,
  externalAxios,
  toApiError,
  type ApiRequestOptions,
} from "@/api/request";
import { isDateTimeExpired } from "@/lib/date";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateVmImageInput,
  CreateVmImageRequest,
  UploadVmImageFileInput,
  VmImage,
  VmImageListParams,
  VmImageListResponse,
  VmImageUploadSession,
  VmImageUploadSessionRequest,
} from "./types";

export type * from "./types";

const createScope = createIdempotencyScope("vm-image-create", ["POST"]);
const sessionScope = createIdempotencyScope("vm-image-upload-session", ["POST"]);
const imagePath = (id: string) => `/virtual-machine-images/${encodeURIComponent(id)}`;

async function vmImageRequest<T>(
  path: string,
  options: ApiRequestOptions,
  fallback: string,
): Promise<T> {
  try {
    return await coreRequest<T, unknown>(path, options);
  } catch (error) {
    if (error instanceof ApiError) {
      const messages: Record<string, string> = {
        VM_IMAGE_INVALID_ARGUMENT: "镜像参数无效，请检查后重试",
        UNAUTHORIZED: "登录已失效，请重新登录",
        FORBIDDEN: "无权执行此镜像操作",
        VM_SCOPE_DENIED: "当前租户无权使用虚拟机镜像",
        VM_IMAGE_NOT_FOUND: "镜像不存在，请刷新列表",
        VM_IMAGE_NOT_READY: "镜像尚未准备好，请稍后重试",
        VM_IMAGE_NOT_UPLOADABLE: "当前镜像不支持上传文件",
        VM_IMAGE_UPLOAD_DISABLED: "镜像上传暂未开放，请联系管理员",
        VM_IDEMPOTENCY_CONFLICT: "提交内容发生冲突，请核对镜像记录后重试",
        VM_IMAGE_NATIVE_IDENTITY_CHANGED: "镜像存储目标已变更，请联系管理员",
        VM_IMAGE_DEPENDENCY_UNAVAILABLE: "镜像依赖服务暂不可用，请稍后重试",
      };
      error.message =
        messages[error.code ?? ""] ??
        (error.status === 503 ? "镜像服务暂不可用，请稍后重试" : fallback);
      if (error.requestId) error.message += `（请求 ID：${error.requestId}）`;
    }
    throw error;
  }
}

export function listVmImages(params: VmImageListParams, signal?: AbortSignal) {
  return vmImageRequest<VmImageListResponse>(
    "/virtual-machine-images",
    { method: "GET", params, signal },
    "虚拟机镜像列表加载失败，请稍后重试",
  );
}

export function getVmImage(imageId: string, signal?: AbortSignal) {
  return vmImageRequest<VmImage>(
    imagePath(imageId),
    { method: "GET", signal },
    "镜像状态加载失败，请稍后重试",
  );
}

// 创建返回值仅用于继续取票、上传，不写入资源查询缓存。
export function createVmImage(input: CreateVmImageInput, file: File, signal: AbortSignal) {
  return runIdempotentRequest(
    createScope,
    input,
    (data) => {
      const request: CreateVmImageRequest = { data };
      return vmImageRequest<VmImage>(
        "/virtual-machine-images",
        { method: "POST", data: request, signal },
        "创建镜像失败，请稍后重试",
      );
    },
    [file.name, file.size, file.lastModified, file.type],
  );
}

function waitForUploadTarget(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new axios.CanceledError());
      return;
    }
    const cancel = () => {
      clearTimeout(timer);
      reject(new axios.CanceledError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, 2000);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

export async function uploadVmImageFile({
  imageId,
  file,
  signal,
  onPhase,
  onProgress,
}: UploadVmImageFileInput): Promise<void> {
  onPhase("preparing");
  // 每次重试先查询状态，已进入校验或可用态时不重复发送文件。
  for (let attempt = 0; attempt < 60; attempt++) {
    const image = await getVmImage(imageId, signal);
    if (image.state === "VERIFYING" || image.state === "READY") return;
    if (image.state !== "PREPARING" && image.state !== "IMPORTING") {
      throw new Error("当前镜像已无法上传，请刷新列表查看状态");
    }
    if (isDateTimeExpired(image.uploadDeadline))
      throw new Error("镜像上传窗口已过期，请重新添加镜像");
    if (file.size <= 0) throw new Error("不能上传空文件");
    let ticket: VmImageUploadSession;
    try {
      // 票据只在本次调用的内存中持有，不进入 Query、日志或持久存储。
      ticket = await runIdempotentRequest(
        sessionScope,
        {},
        (data) => {
          const request: VmImageUploadSessionRequest = { data };
          return vmImageRequest<VmImageUploadSession>(
            `${imagePath(imageId)}/upload-sessions`,
            { method: "POST", data: request, signal },
            "获取上传凭证失败，请稍后重试",
          );
        },
        [imageId, file.name, file.size, file.lastModified, file.type],
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.code === "VM_IMAGE_NOT_READY"
      ) {
        await waitForUploadTarget(signal);
        continue;
      }
      throw error;
    }
    if (isDateTimeExpired(ticket.expiresAt)) throw new Error("上传凭证已过期，请重新上传");
    if (ticket.maxFileBytes !== "0" && BigInt(file.size) > BigInt(ticket.maxFileBytes)) {
      throw new Error("文件超过镜像服务允许的大小，请选择其他文件");
    }
    onPhase("uploading");
    try {
      await externalAxios.request({
        // 上传路径固定，上游地址由代理配置，不使用票据中的集群内地址。
        url: "/api/uploads/vm-images",
        method: ticket.method,
        data: file,
        headers: {
          Authorization: `Bearer ${ticket.bearerToken}`,
          "Content-Type": ticket.contentType,
          Accept: undefined,
        },
        withCredentials: false,
        withXSRFToken: false,
        signal,
        onUploadProgress: ({ loaded, total }) =>
          onProgress(Math.min(100, Math.round((loaded * 100) / (total || file.size)))),
      });
    } catch (error) {
      if (signal.aborted) throw new axios.CanceledError();
      const failure = toApiError(error);
      // 外部错误不能保留 Axios config/response/cause，避免票据 Token 进入 mutation 错误缓存。
      throw new ApiError(
        !failure.status
          ? "无法连接镜像上传服务，请检查网络或联系管理员"
          : failure.status === 401 || failure.status === 403
            ? "上传凭证失效，请重新上传"
            : failure.status === 413
              ? "文件超过镜像服务允许的大小"
              : "文件上传失败，请刷新镜像状态后重试",
        { status: failure.status, code: failure.code, requestId: failure.requestId },
      );
    }
    onProgress(100);
    return;
  }
  throw new Error("镜像上传目标准备超时，请稍后从列表继续上传");
}
