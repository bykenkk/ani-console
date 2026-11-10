import { Descriptions } from "@arco-design/web-react";
import { ResourceIdentity } from "@/components/common";
import type { InstanceConfigurationData, InstanceRecord } from "@/api/instances";
import ContainerNetworkInterfaces from "../ContainerNetworkInterfaces";

type ContainerNetworkProps = {
  configuration?: InstanceConfigurationData;
  instance?: InstanceRecord;
};
export default function ContainerNetwork({ configuration, instance }: ContainerNetworkProps) {
  return (
    <div className="flex flex-col gap-4">
      <Descriptions
        title="网络配置"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ verticalAlign: "top" }}
        data={[
          {
            label: "VPC",
            value: <ResourceIdentity display="id" id={configuration?.network?.vpc_id} />,
          },
          {
            label: "子网",
            value: <ResourceIdentity display="id" id={configuration?.network?.subnet_id} />,
          },
          // FIXME(instance-network-address): Pod IP 不等价于私网 IP 或访问地址；当前契约没有返回这两个字段。
          // TODO(instance-network-address): 保留字段位置，待 Governance 开放等价数据后接入。
          { label: "IP 地址", value: "-" },
          { label: "访问地址", value: "-" },
        ]}
      />
      {instance && <ContainerNetworkInterfaces instance={instance} />}
    </div>
  );
}
