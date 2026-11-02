import { coreRequest } from "@/api/request";

import type { RegistryImageListParams, RegistryImageListResponse } from "./types";

export function listRegistryImages(
  params: RegistryImageListParams = {},
): Promise<RegistryImageListResponse> {
  return coreRequest<RegistryImageListResponse>("/registry/images", { method: "GET", params });
}
