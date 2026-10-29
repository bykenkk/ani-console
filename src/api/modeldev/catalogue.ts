// TODO(modeldev-integration): 部署后验证实现目录、TRAINING 规格、READY 筛选、权限及空页；静态核对不代表可提交。
import { coreRequest } from "@/api/request";
import type { InstancePresetListParams, InstancePresetListResponse } from "@/api/instances";
import type {
  ModelDevImplementationListResponse,
  ModelDevImplementationListParams,
  ModelDevInputVersionListParams,
  ModelDevInputVersionListResponse,
  ModelDevInputVersion,
  CheckFineTuningReadinessInput,
  FineTuningReadiness,
} from "./types";

/** 只检查源模型和所选运行时，不创建执行、不分配算力；该 POST 未声明幂等字段。 */
export function checkFineTuningReadiness(
  input: CheckFineTuningReadinessInput,
  signal?: AbortSignal,
): Promise<FineTuningReadiness> {
  return coreRequest<FineTuningReadiness, CheckFineTuningReadinessInput>(
    "/modeldev/finetuning/readiness/check",
    { method: "POST", data: input, signal },
  );
}

export function listModelDevImplementations(
  params: ModelDevImplementationListParams,
  signal?: AbortSignal,
): Promise<ModelDevImplementationListResponse> {
  // TODO(modeldev-catalogue): 待联调验证 device_mode / kind 组合筛选、分页 total、空页及部署版本。
  return coreRequest<ModelDevImplementationListResponse>("/modeldev/implementations", {
    method: "GET",
    params,
    signal,
  });
}
export function listModelDevComputePresets(
  params: InstancePresetListParams = {},
  signal?: AbortSignal,
): Promise<InstancePresetListResponse> {
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "TRAINING" },
    signal,
  });
}
export function listModelDevInputVersions(
  params: ModelDevInputVersionListParams = {},
  signal?: AbortSignal,
): Promise<ModelDevInputVersionListResponse> {
  return coreRequest<ModelDevInputVersionListResponse>("/modeldev/input-versions", {
    method: "GET",
    params,
    signal,
  });
}
export function getModelDevInputVersion(
  id: string,
  signal?: AbortSignal,
): Promise<ModelDevInputVersion> {
  return coreRequest<ModelDevInputVersion>(`/modeldev/input-versions/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}
