import { Card, Descriptions, Table } from "@arco-design/web-react";
import type { ModelDevPreset } from "@/api/modeldev";

export interface TrainingCreateValues {
  name: string;
  preset_id: string;
  dataset_version_id: string;
  image_version_id?: string;
  parameters: string[];
}

export default function TrainingTaskSummary({
  values,
  preset,
}: {
  values: TrainingCreateValues;
  preset?: ModelDevPreset;
}) {
  const parameters = (preset?.parameter_rules ?? []).map((rule, index) => ({
    name: rule.name,
    value: values.parameters[index] || "未指定",
  }));
  return (
    <Card bordered={false}>
      <Descriptions
        column={1}
        data={[
          { label: "任务名称", value: values.name },
          { label: "训练预设", value: preset?.name ?? "-" },
          { label: "任务类型", value: preset?.kind ?? "-" },
          { label: "数据集版本", value: values.dataset_version_id },
          { label: "镜像版本", value: values.image_version_id || "未指定" },
          { label: "发布版本", value: preset?.active_release_id || "-" },
        ]}
      />
      <Table
        rowKey="name"
        pagination={false}
        data={parameters}
        columns={[
          { title: "参数", dataIndex: "name", ellipsis: true },
          { title: "值", dataIndex: "value" },
        ]}
      />
    </Card>
  );
}
