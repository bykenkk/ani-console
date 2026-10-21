import { withFirst100 } from "@/api/pagination";
import { useQuery } from "@tanstack/react-query";
import { Card, Form, Input, Select } from "@arco-design/web-react";
import {
  listModelDevPresets,
  listModelDevInputVersions,
  type ModelDevPreset,
  type ModelDevInputVersion,
} from "@/api/modeldev";

const listPresetOptions = withFirst100(listModelDevPresets);
const listDatasetOptions = withFirst100(listModelDevInputVersions);

type TrainingTaskBasicFieldsProps = {
  preset?: ModelDevPreset;
  dataset?: ModelDevInputVersion;
  onPresetChange: (preset: ModelDevPreset) => void;
  onDatasetChange: (dataset: ModelDevInputVersion) => void;
};

export default function TrainingTaskBasicFields({
  preset,
  dataset,
  onPresetChange,
  onDatasetChange,
}: TrainingTaskBasicFieldsProps) {
  const presets = useQuery({
    queryKey: ["training-presets", "options"],
    queryFn: ({ signal }) => listPresetOptions({}, signal),
    meta: {
      errorNotification: { id: "training-presets", action: "训练预设加载", fallback: "请稍后重试" },
    },
  });
  const datasets = useQuery({
    queryKey: ["training-inputs", "options", { state: "READY" }],
    queryFn: ({ signal }) => listDatasetOptions({ state: "READY" }, signal),
    meta: {
      errorNotification: {
        id: "training-inputs",
        action: "训练数据集加载",
        fallback: "请稍后重试",
      },
    },
  });
  const presetOptions = presets.data?.items ?? [];
  const datasetOptions = datasets.data?.items ?? [];
  return (
    <Card bordered={false}>
      <Form.Item
        field="name"
        label="任务名称"
        rules={[{ required: true, match: /\S/, message: "请输入任务名称" }]}
      >
        <Input placeholder="请输入任务名称" />
      </Form.Item>
      <Form.Item
        field="preset_id"
        label="训练预设"
        rules={[{ required: true, message: "请选择训练预设" }]}
      >
        <Select
          placeholder="请选择训练预设"
          filterOption={false}
          loading={presets.isFetching}
          options={[
            ...(preset && !presetOptions.some((p) => p.preset_id === preset.preset_id)
              ? [preset]
              : []),
            ...presetOptions,
          ].map((p) => ({
            value: p.preset_id,
            label: p.name,
            disabled: !p.new_submissions_enabled || !p.active_release_id,
          }))}
          onChange={(id) => {
            const selected = presetOptions.find((p) => p.preset_id === id);
            if (selected) onPresetChange(selected);
          }}
        />
      </Form.Item>
      <Form.Item field="image_version_id" label="镜像版本">
        <Select allowClear placeholder="不指定镜像版本" options={preset?.image_version_ids ?? []} />
      </Form.Item>
      <Form.Item
        field="dataset_version_id"
        label="数据集版本"
        rules={[{ required: true, message: "请选择数据集版本" }]}
      >
        <Select
          placeholder="请选择已就绪的数据集"
          filterOption={false}
          loading={datasets.isFetching}
          options={[
            ...(dataset &&
            !datasetOptions.some((d) => d.input_version_id === dataset.input_version_id)
              ? [dataset]
              : []),
            ...datasetOptions,
          ].map((d) => ({
            value: d.input_version_id,
            label: d.input_version_id + " · " + (d.format || "-"),
          }))}
          onChange={(id) => {
            const selected = datasetOptions.find((d) => d.input_version_id === id);
            if (selected) onDatasetChange(selected);
          }}
        />
      </Form.Item>
    </Card>
  );
}
