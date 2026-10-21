// TODO(modeldev-integration): 当前 Governance 已采用 /api/v1、page/pageSize、items/total；联调核对预设、READY 筛选和空页，并同步旧交接说明。
import { coreRequest } from "@/api/request";
import type { PageParams } from "@/api/types";
import type {
  ModelDevPresetListResponse,
  ModelDevInputVersionListParams,
  ModelDevInputVersionListResponse,
  ModelDevInputVersion,
} from "./types";

export function listModelDevPresets(
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<ModelDevPresetListResponse> {
  return coreRequest<ModelDevPresetListResponse>("/modeldev/presets", {
    method: "GET",
    params,
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
