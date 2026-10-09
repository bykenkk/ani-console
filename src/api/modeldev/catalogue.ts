import { adminRequest } from "@/api/request";
import type {
  ModelDevPageParams,
  ModelDevPresetListResponse,
  ModelDevInputVersionListParams,
  ModelDevInputVersionListResponse,
  ModelDevInputVersion,
} from "./types";

export function listModelDevPresets(
  params: ModelDevPageParams = {},
  signal?: AbortSignal,
): Promise<ModelDevPresetListResponse> {
  return adminRequest<ModelDevPresetListResponse>("/modeldev/presets", {
    method: "GET",
    params,
    signal,
  });
}
export function listModelDevInputVersions(
  params: ModelDevInputVersionListParams = {},
  signal?: AbortSignal,
): Promise<ModelDevInputVersionListResponse> {
  return adminRequest<ModelDevInputVersionListResponse>("/modeldev/input-versions", {
    method: "GET",
    params,
    signal,
  });
}
export function getModelDevInputVersion(
  id: string,
  signal?: AbortSignal,
): Promise<ModelDevInputVersion> {
  return adminRequest<ModelDevInputVersion>(`/modeldev/input-versions/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}
