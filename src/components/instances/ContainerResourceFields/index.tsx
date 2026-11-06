import { Checkbox, Form, Input, Typography } from "@arco-design/web-react";
import { VpcSelect, SubnetSelect } from "@/components/common";
import SecurityGroupSelect from "@/components/common/SecurityGroupSelect";
import type { NetworkSecurityGroup, NetworkSubnet, NetworkVPC } from "@/api/network";
import InstanceVolumeMountEditor from "../InstanceVolumeMountEditor";
import { validateMountPath } from "./utils";

type ContainerResourceFieldsProps = {
  values: { network_enabled: boolean; vpc_id: string };
  onVpcChange: (vpc: NetworkVPC | undefined) => void;
  onSubnetChange: (subnet: NetworkSubnet | undefined) => void;
  onSecurityGroupsChange: (groups: Pick<NetworkSecurityGroup, "id" | "name">[]) => void;
};

export default function ContainerResourceFields({
  values,
  onVpcChange,
  onSubnetChange,
  onSecurityGroupsChange,
}: ContainerResourceFieldsProps) {
  return (
    <>
      <Typography.Title heading={6}>网络与安全</Typography.Title>
      <Form.Item field="network_enabled" triggerPropName="checked">
        <Checkbox>配置专有网络（VPC）</Checkbox>
      </Form.Item>
      {values.network_enabled && (
        <>
          <div className="grid grid-cols-2 items-start gap-4">
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
                key={values.vpc_id}
                vpcId={values.vpc_id}
                canUse
                disabled={!values.vpc_id}
                onChange={(_, subnet) => onSubnetChange(subnet)}
              />
            </Form.Item>
          </div>
          <Form.Item
            field="security_group_ids"
            label="安全组"
            extra="可多选，留空表示不绑定安全组。"
          >
            <SecurityGroupSelect onChange={(_, groups) => onSecurityGroupsChange(groups)} />
          </Form.Item>
        </>
      )}
      <Typography.Title heading={6}>存储配置</Typography.Title>
      <Form.Item
        field="workspace_mount_path"
        label="工作卷挂载路径"
        extra="工作卷在容器内的挂载路径，默认 /workspace。"
        rules={[
          { required: true, message: "请输入工作卷挂载路径" },
          { validator: (path, cb) => cb(validateMountPath(path)) },
        ]}
      >
        <Input placeholder="请输入绝对路径，例如 /workspace" />
      </Form.Item>
      <Form.Item
        label="存储卷挂载"
        extra="最多挂载 8 个已有存储卷。删除实例仅解除挂载，不删除用户存储卷。"
      >
        <InstanceVolumeMountEditor />
      </Form.Item>
    </>
  );
}
