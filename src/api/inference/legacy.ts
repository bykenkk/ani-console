// 以下仍为 ANI Services 的 /api/v1/svc/inference-services 契约。
// 待逐项确认 governance 的等价能力后迁移调用方；不得直接替换同名函数或混用响应类型。
// TODO(governance-migration): 保留旧扩缩容更新和服务策略查询；对应调用方迁移后删除此模块。
import { runIdempotentRequest } from "@/api/idempotency";
import { servicesRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  InferenceOperation,
  InferenceServicePolicies,
  UpdateInferenceServiceInput,
  UpdateInferenceServiceRequest,
} from "./legacy-types";

const servicePath = (serviceId: string) => `/inference-services/${encodeURIComponent(serviceId)}`;

const updateScope = createIdempotencyScope("inference-service-update", ["PATCH"]);

export function updateInferenceService(
  serviceId: string,
  submitData: UpdateInferenceServiceInput,
): Promise<InferenceOperation> {
  return runIdempotentRequest(
    updateScope,
    submitData,
    (body) =>
      servicesRequest<InferenceOperation, UpdateInferenceServiceRequest>(servicePath(serviceId), {
        method: "PATCH",
        data: body,
      }),
    [serviceId],
  );
}

export function listInferenceServicePolicies(serviceId: string): Promise<InferenceServicePolicies> {
  return servicesRequest<InferenceServicePolicies>(`${servicePath(serviceId)}/policies`, {
    method: "GET",
  });
}

export type { InferenceAccessPolicy } from "./legacy-types";
