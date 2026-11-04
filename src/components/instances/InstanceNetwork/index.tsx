import { Descriptions, Spin } from "@arco-design/web-react";
import { ResourceId } from "@/components/common";
import type { InstanceConfigurationData } from "@/api/instances";
type InstanceNetworkProps = { configuration?: InstanceConfigurationData; loading?: boolean };
export default function InstanceNetwork({ configuration, loading = false }: InstanceNetworkProps) {
  return (
    <Spin loading={loading} className="w-full">
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
            value: configuration?.network?.vpc_id ? (
              <ResourceId value={configuration.network.vpc_id} />
            ) : (
              "-"
            ),
          },
          {
            label: "子网",
            value: configuration?.network?.subnet_id ? (
              <ResourceId value={configuration.network.subnet_id} />
            ) : (
              "-"
            ),
          },
          // FIXME(instance-network-address): Pod IP 不等价于私网 IP 或访问地址；当前契约没有返回这两个字段。
          // TODO(instance-network-address): 保留字段位置，待 Governance 开放等价数据后接入。
          { label: "IP 地址", value: "-" },
          { label: "访问地址", value: "-" },
        ]}
      />
    </Spin>
  );
}
