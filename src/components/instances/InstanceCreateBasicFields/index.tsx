import { Form, Input } from "@arco-design/web-react";
import type { ComputeType, InstancePreset } from "@/api/instances";
import RegisteredImageSelect from "@/components/common/RegisteredImageSelect";
import InstanceComputeSelect from "@/components/instances/InstanceComputeSelect";

type InstanceCreateBasicFieldsProps = {
  computeType: ComputeType;
};

export default function InstanceCreateBasicFields({ computeType }: InstanceCreateBasicFieldsProps) {
  const { form } = Form.useFormContext();
  return (
    <>
      <Form.Item
        field="name"
        label="名称"
        rules={[
          { required: true, message: "请输入实例名称" },
          {
            validator: (value, callback) =>
              callback(typeof value === "string" && value.trim() ? undefined : "请输入实例名称"),
          },
        ]}
      >
        <Input maxLength={80} />
      </Form.Item>
      <Form.Item
        field="image"
        label="镜像"
        validateTrigger="onSelect"
        rules={[{ type: "object", required: true, message: "请选择已注册的镜像" }]}
      >
        <RegisteredImageSelect
          onScopeChange={() => form.setFields({ image: { error: undefined } })}
        />
      </Form.Item>
      <Form.Item
        field="preset"
        label="算力规格"
        validateTrigger="onSelect"
        rules={[
          { type: "object", required: true, message: "请选择算力规格" },
          {
            validator: (value: InstancePreset | undefined, callback) =>
              callback(
                value?.compute_type === computeType &&
                  value.enabled &&
                  value.selectable &&
                  (computeType !== "gpu" || value.gpu)
                  ? undefined
                  : "算力规格不可用，请重新选择",
              ),
          },
        ]}
      >
        <InstanceComputeSelect computeType={computeType} />
      </Form.Item>
    </>
  );
}
