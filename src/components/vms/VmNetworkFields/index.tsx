import { Form } from "@arco-design/web-react";
import { VpcSelect, SubnetSelect } from "@/components/common";

type VmNetworkFieldsProps = { vpcId: string; onVpcChange: () => void };
export default function VmNetworkFields({ vpcId, onVpcChange }: VmNetworkFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Form.Item field="vpc_id" label="VPC" rules={[{ required: true, message: "请选择 VPC" }]}>
        <VpcSelect canUse onChange={onVpcChange} />
      </Form.Item>
      <Form.Item field="subnet_id" label="子网" rules={[{ required: true, message: "请选择子网" }]}>
        <SubnetSelect key={vpcId} vpcId={vpcId} canUse disabled={!vpcId} />
      </Form.Item>
    </div>
  );
}
