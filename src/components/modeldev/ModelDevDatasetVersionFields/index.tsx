import { Form, Select } from "@arco-design/web-react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { listDatasets, listDatasetVersions, type DatasetVersion } from "@/api/modeldev";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

const listDatasetOptions = withFirst100(listDatasets);
const listVersionOptions = (datasetId: string) =>
  withFirst100((params, signal) => listDatasetVersions(datasetId, params, signal));

type ModelDevDatasetVersionFieldsProps = {
  datasetId: string;
  onSelect: (version: DatasetVersion | undefined) => void;
};

export default function ModelDevDatasetVersionFields({
  datasetId,
  onSelect,
}: ModelDevDatasetVersionFieldsProps) {
  const datasets = useQuery({
    queryKey: ["datasets", "options", { state: "ACTIVE" }],
    queryFn: ({ signal }) => listDatasetOptions({ state: "ACTIVE" }, signal),
    meta: { errorNotification: { id: "dataset-options", action: "数据集选项加载" } },
  });
  const versions = useQuery({
    queryKey: ["dataset-versions", datasetId, "options"],
    queryFn: datasetId ? ({ signal }) => listVersionOptions(datasetId)({}, signal) : skipToken,
    meta: {
      errorNotification: {
        id: withId("dataset-version-options", datasetId),
        action: "数据集版本选项加载",
      },
    },
  });
  return (
    <>
      <Form.Item
        field="datasetId"
        label="数据集"
        formatter={(value) => value || undefined}
        rules={[{ required: true, message: "请选择数据集" }]}
      >
        <Select
          placeholder="请选择启用的数据集"
          filterOption={false}
          loading={datasets.isFetching}
          options={(datasets.data?.items ?? []).map((dataset) => ({
            value: dataset.dataset_id,
            label: dataset.name,
          }))}
          onChange={() => onSelect(undefined)}
        />
      </Form.Item>
      <Form.Item
        field="dataset"
        label="数据集版本"
        formatter={(value) => value || undefined}
        rules={[{ required: true, message: "请选择已发布的数据集版本" }]}
      >
        <Select
          placeholder="请选择已发布的数据集版本"
          filterOption={false}
          disabled={!datasetId}
          loading={versions.isFetching}
          options={(versions.data?.items ?? []).map((version) => ({
            value: version.input_version_id,
            label: `版本 ${version.version_number} · ${version.input_version?.format || "-"} · ${version.input_version_id}`,
            disabled:
              version.input_version?.state !== "READY" || version.input_version.format !== "JSON",
          }))}
          onChange={(id) =>
            onSelect(versions.data?.items.find((version) => version.input_version_id === id))
          }
        />
      </Form.Item>
    </>
  );
}
