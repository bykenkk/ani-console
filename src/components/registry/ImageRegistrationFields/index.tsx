import { Form, Input, Select } from "@arco-design/web-react";
import { IMAGE_ACCELERATORS, IMAGE_PURPOSES } from "../options";

export default function ImageRegistrationFields({ creating }: { creating: boolean }) {
  return (
    <>
      {creating && (
        <Form.Item
          field="imageReference"
          label="镜像地址"
          rules={[{ required: true, match: /\S/, message: "请输入已推送的镜像地址" }]}
          extra="填写当前租户空间中已推送的镜像地址（含 Tag 或 digest）。"
        >
          <Input placeholder="registry.example.com/t-project/app:tag" />
        </Form.Item>
      )}
      <Form.Item
        field="displayName"
        label="名称"
        rules={[{ required: true, match: /\S/, message: "请输入镜像名称" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item field="description" label="描述">
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
      </Form.Item>
      <Form.Item field="purposes" label="用途">
        <Select mode="multiple" allowClear options={IMAGE_PURPOSES} placeholder="选择镜像用途" />
      </Form.Item>
      <Form.Item field="accelerator" label="加速器">
        <Select options={IMAGE_ACCELERATORS} />
      </Form.Item>
    </>
  );
}
