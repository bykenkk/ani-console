import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type { PageParams } from "@/api/types";
import type {
  CreateDatasetInput,
  CreateDatasetRequest,
  Dataset,
  DatasetListParams,
  DatasetListResponse,
  DatasetRevisionInput,
  DatasetRevisionRequest,
  UpdateDatasetInput,
  UpdateDatasetRequest,
  InspectDatasetSourceInput,
  InspectDatasetSourceResponse,
  ImportDatasetVersionInput,
  ImportDatasetVersionRequest,
  DatasetVersionListResponse,
  DatasetInputVersion,
  DatasetPreview,
  DatasetOperationListParams,
  DatasetOperationListResponse,
} from "./types";

const createScope = createIdempotencyScope("dataset-create", ["POST"]);
const updateScope = createIdempotencyScope("dataset-update", ["PATCH"]);
const archiveScope = createIdempotencyScope("dataset-archive", ["POST"]);
const restoreScope = createIdempotencyScope("dataset-restore", ["POST"]);
const importScope = createIdempotencyScope("dataset-import", ["POST"]);
const datasetPath = (id: string) => `/modeldev/datasets/${encodeURIComponent(id)}`;
const inputVersionPath = (id: string) => `/modeldev/input-versions/${encodeURIComponent(id)}`;

export function listDatasets(
  params: DatasetListParams = {},
  signal?: AbortSignal,
): Promise<DatasetListResponse> {
  return coreRequest("/modeldev/datasets", { method: "GET", params, signal });
}
export function getDataset(id: string, signal?: AbortSignal): Promise<Dataset> {
  return coreRequest(datasetPath(id), { method: "GET", signal });
}
export function createDataset(input: CreateDatasetInput): Promise<void> {
  return runIdempotentRequest(createScope, { data: input }, async (data) => {
    await coreRequest<unknown, CreateDatasetRequest>("/modeldev/datasets", {
      method: "POST",
      data,
    });
  });
}
export function updateDataset(id: string, input: UpdateDatasetInput): Promise<void> {
  const fields = [
    input.name !== undefined ? "name" : undefined,
    input.description !== undefined ? "description" : undefined,
  ];
  const submitData = { data: input, update_mask: fields.filter(Boolean).join(",") };
  return runIdempotentRequest(
    updateScope,
    submitData,
    async (data) => {
      await coreRequest<unknown, UpdateDatasetRequest>(datasetPath(id), { method: "PATCH", data });
    },
    [id],
  );
}
export function archiveDataset(id: string, input: DatasetRevisionInput): Promise<void> {
  return runIdempotentRequest(
    archiveScope,
    { data: input },
    async (data) => {
      await coreRequest<unknown, DatasetRevisionRequest>(`${datasetPath(id)}:archive`, {
        method: "POST",
        data,
      });
    },
    [id],
  );
}
export function restoreDataset(id: string, input: DatasetRevisionInput): Promise<void> {
  return runIdempotentRequest(
    restoreScope,
    { data: input },
    async (data) => {
      await coreRequest<unknown, DatasetRevisionRequest>(`${datasetPath(id)}:restore`, {
        method: "POST",
        data,
      });
    },
    [id],
  );
}
/** 单文件检查为只读 POST，契约未声明幂等键，不追加 key 或 Header。 */
export function inspectDatasetSource(
  input: InspectDatasetSourceInput,
  signal?: AbortSignal,
): Promise<InspectDatasetSourceResponse> {
  return coreRequest("/modeldev/dataset-sources:inspect", {
    method: "POST",
    data: { data: { mode: "INSPECT_FILE", source: input } },
    signal,
  });
}
export function importDatasetVersion(id: string, input: ImportDatasetVersionInput): Promise<void> {
  return runIdempotentRequest(
    importScope,
    { data: input },
    async (data) => {
      await coreRequest<unknown, ImportDatasetVersionRequest>(`${datasetPath(id)}:import`, {
        method: "POST",
        data,
      });
    },
    [id],
  );
}
export function listDatasetVersions(
  id: string,
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<DatasetVersionListResponse> {
  return coreRequest(`${datasetPath(id)}/versions`, { method: "GET", params, signal });
}
export function getDatasetInputVersion(
  id: string,
  signal?: AbortSignal,
): Promise<DatasetInputVersion> {
  return coreRequest(inputVersionPath(id), { method: "GET", signal });
}
export function getDatasetPreview(id: string, signal?: AbortSignal): Promise<DatasetPreview> {
  return coreRequest(`${inputVersionPath(id)}/preview`, { method: "GET", signal });
}
export function listDatasetOperations(
  id: string,
  params: DatasetOperationListParams = {},
  signal?: AbortSignal,
): Promise<DatasetOperationListResponse> {
  return coreRequest(`${datasetPath(id)}/operations`, { method: "GET", params, signal });
}
