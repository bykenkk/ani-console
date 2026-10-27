import { Card, Form, Input } from "@arco-design/web-react";
import type { ModelDevImplementation, ModelDevInputVersion } from "@/api/modeldev";
import ModelDevImplementationField from "@/components/ai-training/ModelDevImplementationField";
import InstanceComputeSelect from "@/components/instances/InstanceComputeSelect";
import ModelDevInputField from "@/components/ai-training/ModelDevInputField";
import type { TrainingTaskCreateFormValues } from "../index";

type TrainingTaskBasicFieldsProps = {
  values: TrainingTaskCreateFormValues;
  onImplementationSelect: (implementation: ModelDevImplementation | undefined) => void;
  onInputSelect: (version: ModelDevInputVersion | undefined) => void;
};

export default function TrainingTaskBasicFields({
  values,
  onImplementationSelect,
  onInputSelect,
}: TrainingTaskBasicFieldsProps) {
  const { form } = Form.useFormContext();
  return (
    <Card bordered={false}>
      <Form.Item
        field="name"
        label="名称"
        rules={[
          { required: true, message: "请输入名称" },
          {
            validator: (value, callback) =>
              callback(
                value && (value !== value.trim() || /\p{Cc}/u.test(value))
                  ? "名称不能包含首尾空格或控制字符"
                  : undefined,
              ),
          },
        ]}
      >
        <Input placeholder="请输入名称" maxLength={80} showWordLimit />
      </Form.Item>
      <Form.Item
        field="preset"
        label="算力规格"
        validateTrigger="onSelect"
        rules={[{ type: "object", required: true, message: "请选择算力规格" }]}
      >
        <InstanceComputeSelect
          usage="TRAINING"
          onTypeChange={() => form.setFields({ preset: { error: undefined } })}
        />
      </Form.Item>
      <ModelDevImplementationField
        field="implementation_id"
        kind="GENERAL_TRAINING"
        selectedId={values.implementation_id}
        onResolve={onImplementationSelect}
      />
      <ModelDevInputField field="dataset_version_id" onSelect={onInputSelect} />
    </Card>
  );
}
