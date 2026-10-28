import { Form, Input, Radio } from "@arco-design/web-react";
import ModelSelect from "@/components/ai-models/ModelSelect";
import type { Model } from "@/api/models";
import type { CreateFineTuningFormValues } from "../index";
import { REGISTRATION_OPTIONS } from "../constants";

type FineTuningRegistrationFieldsProps = {
  mode: CreateFineTuningFormValues["registrationMode"];
  onTargetModelSelect: (model: Model | undefined) => void;
};

export default function FineTuningRegistrationFields({
  mode,
  onTargetModelSelect,
}: FineTuningRegistrationFieldsProps) {
  // TODO(finetuning-registration): 联调已有模型选项及权限；登记随训练创建意图提交，不提前创建模型。
  return (
    <>
      <Form.Item field="registrationMode" label="训练结果登记">
        <Radio.Group type="button" aria-label="训练结果登记" options={REGISTRATION_OPTIONS} />
      </Form.Item>
      {mode === "existing" && (
        <Form.Item
          field="targetModelId"
          label="目标模型"
          rules={[{ required: true, message: "请选择目标模型" }]}
        >
          <ModelSelect placeholder="请选择目标模型" onSelect={onTargetModelSelect} />
        </Form.Item>
      )}
      {mode === "new" && (
        <Form.Item
          field="newModelName"
          label="新模型名称"
          rules={[
            { required: true, message: "请输入新模型名称" },
            { match: /^[a-z0-9.-]{1,63}$/, message: "限 1–63 个小写字母、数字、点或连字符" },
          ]}
        >
          <Input maxLength={63} placeholder="请输入新模型名称" />
        </Form.Item>
      )}
    </>
  );
}
