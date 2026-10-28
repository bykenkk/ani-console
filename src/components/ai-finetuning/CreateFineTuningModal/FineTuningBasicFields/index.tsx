import { Card, Form, Input } from "@arco-design/web-react";
import type { ModelDevImplementation, ModelDevInputVersion } from "@/api/modeldev";
import type { Model, ModelVersion } from "@/api/models";
import ModelDevImplementationField from "@/components/ai-training/ModelDevImplementationField";
import InstanceComputeSelect from "@/components/instances/InstanceComputeSelect";
import ModelDevInputField from "@/components/ai-training/ModelDevInputField";
import type { CreateFineTuningFormValues } from "../index";
import FineTuningBaseModelFields from "../FineTuningBaseModelFields";
import FineTuningRegistrationFields from "../FineTuningRegistrationFields";

type FineTuningBasicFieldsProps = {
  values: CreateFineTuningFormValues;
  onImplementationSelect: (implementation: ModelDevImplementation | undefined) => void;
  onInputSelect: (version: ModelDevInputVersion | undefined) => void;
  onBaseModelSelect: (model: Model | undefined) => void;
  onTargetModelSelect: (model: Model | undefined) => void;
  onBaseVersionChange: (id: string, version?: ModelVersion, modelName?: string) => void;
};

export default function FineTuningBasicFields({
  values,
  onImplementationSelect,
  onInputSelect,
  onBaseModelSelect,
  onTargetModelSelect,
  onBaseVersionChange,
}: FineTuningBasicFieldsProps) {
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
      <FineTuningBaseModelFields
        modelId={values.baseModelId}
        onModelSelect={onBaseModelSelect}
        onVersionChange={onBaseVersionChange}
      />
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
        field="method"
        kind="FINETUNING"
        selectedId={values.method}
        onResolve={onImplementationSelect}
      />
      <ModelDevInputField field="dataset" format="JSON" onSelect={onInputSelect} />
      <FineTuningRegistrationFields
        mode={values.registrationMode}
        onTargetModelSelect={onTargetModelSelect}
      />
    </Card>
  );
}
