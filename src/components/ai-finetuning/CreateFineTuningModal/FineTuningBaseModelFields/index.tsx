import { Form, Grid } from "@arco-design/web-react";
import type { Model, ModelVersion } from "@/api/models";
import ModelSelect, { ModelVersionSelect } from "@/components/ai-models/ModelSelect";

type FineTuningBaseModelFieldsProps = {
  modelId: string;
  onModelSelect: (model: Model | undefined) => void;
  onVersionChange: (id: string, version?: ModelVersion, modelName?: string) => void;
};

export default function FineTuningBaseModelFields({
  modelId,
  onModelSelect,
  onVersionChange,
}: FineTuningBaseModelFieldsProps) {
  // TODO(finetuning-model): 联调模型/版本权限、ready 筛选、切换后的回显；提交恢复时由后端复核基模可读及可下载。
  return (
    <Grid.Row gutter={16}>
      <Grid.Col span={12}>
        <Form.Item
          field="baseModelId"
          label="模型"
          rules={[{ required: true, message: "请选择模型" }]}
        >
          <ModelSelect status="ready" onSelect={onModelSelect} />
        </Form.Item>
      </Grid.Col>
      <Grid.Col span={12}>
        <Form.Item
          field="baseModelVersionId"
          label="模型版本"
          rules={[{ required: true, message: "请选择模型版本" }]}
        >
          <ModelVersionSelect key={modelId} modelId={modelId} onChange={onVersionChange} />
        </Form.Item>
      </Grid.Col>
    </Grid.Row>
  );
}
