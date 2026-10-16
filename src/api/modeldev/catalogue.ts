// FIXME(modeldev-integration): 补充说明使用 /admin/v1、page_size/page_token、presets/input_versions；当前 governance 实现使用 /api/v1、limit/cursor、items/total。
// TODO(modeldev-integration): 请后端统一部署契约与交接文档后再调整此模块；不得仅按旧说明切换路径或混用响应字段。
import { coreRequest } from "@/api/request";
import type { CursorPageParams } from "@/api/types";
import type {
  ModelDevPresetListResponse,
  ModelDevInputVersionListParams,
  ModelDevInputVersionListResponse,
  ModelDevInputVersion,
} from "./types";

export function listModelDevPresets(
  params: CursorPageParams = {},
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
