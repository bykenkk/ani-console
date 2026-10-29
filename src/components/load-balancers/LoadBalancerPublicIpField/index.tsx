import { Form } from "@arco-design/web-react";
import PublicIpSelect from "@/components/network/PublicIpSelect";

export default function LoadBalancerPublicIpField() {
  return (
    <Form.Item
      label="公网 IP"
      field="publicIp"
      rules={[{ required: true, message: "请选择公网 IP" }]}
    >
      <PublicIpSelect />
    </Form.Item>
  );
}
