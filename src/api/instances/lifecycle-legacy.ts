// FIXME(governance-migration): 重启、扩缩容、镜像更新、保护等操作没有等价 governance 契约，保留原调用。
// TODO(governance-migration): 后端补齐后按实例类型逐项迁移；不将 restart/resize 等伪装为启停。
import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import { instancePath } from "./records-legacy";
import type {
  InstanceLifecycleInput,
  InstanceLifecycleRequest,
  InstanceLifecycleResponse,
} from "./types-legacy";
const lifecycleScope = createIdempotencyScope("instance-lifecycle", ["POST"]);
export function applyInstanceLifecycle(
  instanceId: string,
  submitData: InstanceLifecycleInput,
): Promise<InstanceLifecycleResponse> {
  return runIdempotentRequest(
    lifecycleScope,
    submitData,
    (body) =>
      coreRequest<InstanceLifecycleResponse, InstanceLifecycleRequest>(
        `${instancePath(instanceId)}/lifecycle`,
        { method: "POST", data: body },
      ),
    [instanceId, submitData.action],
  );
}
