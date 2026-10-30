import { ApiError, coreRequest, externalAxios, toApiError } from "@/api/request";
import type {
  StorageObjectDownloadInfo,
  StorageObjectInput,
  StorageObjectListParams,
  StorageObjectListResponse,
  StorageObjectMeta,
  StorageObjectRequest,
  StorageObjectDeleteInput,
  StorageObjectUploadInput,
  StorageObjectUploadTicket,
  UploadStorageObjectFileInput,
} from "./types";
const bucketPath = (bucketId: string) => `/storage/buckets/${encodeURIComponent(bucketId)}`;
export function listStorageObjects(
  bucketId: string,
  params: StorageObjectListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<StorageObjectListResponse>(`${bucketPath(bucketId)}/objects`, {
    method: "GET",
    params: { ...params, prefix: params.prefix === "" ? undefined : params.prefix },
    signal,
  });
}
// 两个 POST 均为查询能力，契约未声明幂等字段，保留返回值且不追加 key。
export function getStorageObject(input: StorageObjectInput, signal?: AbortSignal) {
  return coreRequest<StorageObjectMeta, StorageObjectRequest>(
    `${bucketPath(input.bucket_id)}/objects:head`,
    {
      method: "POST",
      data: { data: input },
      signal,
    },
  );
}
export function getStorageObjectDownload(input: StorageObjectInput, signal?: AbortSignal) {
  return coreRequest<StorageObjectDownloadInfo, StorageObjectRequest>(
    `${bucketPath(input.bucket_id)}/objects:download-url`,
    {
      method: "POST",
      data: { data: input },
      signal,
    },
  );
}
export type * from "./types";

// 删除自身幂等（DELETED/GONE 均成功）；取票也未声明幂等 key，不追加字段或 Header。
// TODO(storage-runtime): 待前端联调验证 ETag 冲突、重复删除 GONE 和写后刷新。
export async function deleteStorageObject(input: StorageObjectDeleteInput): Promise<void> {
  await coreRequest(`${bucketPath(input.bucket_id)}/objects:delete`, {
    method: "POST",
    data: { data: input },
  });
}

// TODO(storage-runtime): 待前端联调验证直传 CORS、取消、超时复核及重复提交。
export async function uploadStorageObjectFile({
  bucketId,
  key,
  file,
  signal,
}: UploadStorageObjectFileInput): Promise<void> {
  if (file.size <= 0 || file.size > 2147483648)
    throw new Error("文件大小必须大于 0 且不超过 2 GiB");
  if (
    !key ||
    key.startsWith("/") ||
    key.endsWith("/") ||
    key.includes("\0") ||
    new Blob([key]).size > 1024
  ) {
    throw new Error("对象路径不能以 / 开头或结尾、包含 NUL，且不能超过 1024 字节");
  }
  const input: StorageObjectUploadInput = {
    bucket_id: bucketId,
    key,
    content_type: file.type || "application/octet-stream",
    size: file.size,
    overwrite: false,
  };
  // 票据仅在本次调用中持有，不进入 Query 缓存或持久存储。
  const ticket = await coreRequest<StorageObjectUploadTicket, { data: StorageObjectUploadInput }>(
    `${bucketPath(bucketId)}/objects:upload-url`,
    {
      method: "POST",
      data: { data: input },
      signal,
    },
  );
  try {
    await externalAxios.put(ticket.url, file, {
      headers: { Accept: undefined, ...ticket.headers },
      withCredentials: false,
      withXSRFToken: false,
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    const failure = toApiError(error);
    // 网络失败不能证明写入失败；先复核，不自动覆盖或重传。
    if (!failure.status) {
      try {
        const object = await getStorageObject({ bucket_id: bucketId, key }, signal);
        if (object.size === String(file.size)) return;
      } catch {
        // HEAD 也失败时保留直传错误；用户刷新后决定是否重试。
      }
    }
    const message =
      failure.status === 412
        ? "对象已存在，请刷新后确认"
        : failure.status === 403
          ? "上传票据已过期或签名不匹配，请重新上传"
          : failure.status === 413
            ? "文件超过对象存储大小限制"
            : failure.message;
    throw new ApiError(message, {
      status: failure.status,
      code: failure.code,
      response: failure.response,
      config: failure.config,
      cause: failure,
    });
  }
  const object = await getStorageObject({ bucket_id: bucketId, key }, signal);
  if (object.size !== String(file.size))
    throw new Error("上传结果异常：对象大小与所选文件不一致，请刷新后核对");
}
