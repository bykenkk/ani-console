// TODO(instance-detail-migration): 云主机、沙箱先统一使用实例公共组件；对应字段、契约及运行时联调验证完成后移除此标记。
import { DataTable, StatusBadge } from "@/components/common";
import type { InstanceConfigurationData, InstanceRuntime } from "@/api/instances";
import type { ReactNode } from "react";

type InstanceNetworkProps = {
  configuration?: InstanceConfigurationData;
  networkState?: string;
  networkReason?: string;
  runtime?: InstanceRuntime;
  loading?: boolean;
};

export default function InstanceNetwork({
  configuration,
  networkState,
  networkReason,
  runtime,
  loading = false,
}: InstanceNetworkProps) {
  const rows: Array<{ name: string; value: ReactNode }> = [
    {
      name: "网络状态",
      value: (
        <StatusBadge status={networkState} reason={networkReason}>
          {networkState === "not_requested" ? "未配置" : undefined}
        </StatusBadge>
      ),
    },
    { name: "VPC", value: configuration?.network?.vpc_id ?? "-" },
    { name: "子网", value: configuration?.network?.subnet_id ?? "-" },
    { name: "Pod IP", value: runtime?.pod?.podIp ?? "-" },
    // FIXME(instance-network-address): Pod IP 不等价于私网 IP 或访问地址；当前契约没有返回这两个字段。
    // TODO(instance-network-address): 保留字段位置，待 Governance 开放等价数据后接入。
    { name: "私网 IP", value: "-" },
    { name: "访问地址", value: "-" },
  ];
  return (
    <DataTable
      data={rows}
      loading={loading}
      rowKey="name"
      pagination={false}
      columns={[
        { title: "类型", dataIndex: "name", width: 160 },
        { title: "名称", width: 200, dataIndex: "value" },
      ]}
    />
  );
}
