import { Form } from "@arco-design/web-react";
import { VpcSelect, SubnetSelect } from "@/components/common";
import type { NetworkSubnet, NetworkVPC } from "@/api/network";

type VmNetworkFieldsProps = {
  vpcId: string;
  onVpcChange: (vpc: NetworkVPC | undefined) => void;
  onSubnetChange: (subnet: NetworkSubnet | undefined) => void;
};
export default function VmNetworkFields({
  vpcId,
  onVpcChange,
  onSubnetChange,
}: VmNetworkFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Form.Item
        field="vpc_id"
        label="专有网络（VPC）"
        formatter={(id: string | undefined) => id || undefined}
        rules={[{ required: true, message: "请选择 VPC" }]}
      >
        <VpcSelect canUse onChange={(_, vpc) => onVpcChange(vpc)} />
      </Form.Item>
      <Form.Item
        field="subnet_id"
        label="子网"
        formatter={(id: string | undefined) => id || undefined}
        rules={[{ required: true, message: "请选择子网" }]}
      >
        <SubnetSelect
          key={vpcId}
          vpcId={vpcId}
          canUse
          disabled={!vpcId}
          onChange={(_, subnet) => onSubnetChange(subnet)}
        />
      </Form.Item>
    </div>
  );
}
