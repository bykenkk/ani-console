import type { NetworkLoadBalancerBackend } from "@/api/network";
import { DataTable, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

export default function LoadBalancerBackends({
  backends = [],
}: {
  backends?: NetworkLoadBalancerBackend[];
}) {
  return (
    <DataTable<NetworkLoadBalancerBackend>
      columns={[
        { title: "成员 ID", dataIndex: "id", ellipsis: true },
        { title: "地址", dataIndex: "address" },
        { title: "端口", dataIndex: "port" },
        { title: "权重", dataIndex: "weight" },
        { title: "子网", dataIndex: "subnet_id", ellipsis: true },
        {
          title: "状态",
          render: (_, row) => <StatusBadge status={row.state} reason={row.reason} />,
        },
        {
          title: "观测时间",
          render: (_, row) => (row.observed_at ? formatDateTime(row.observed_at) : "-"),
        },
        {
          title: "观测数据",
          render: (_, row) =>
            row.observation_stale === undefined ? "-" : row.observation_stale ? "已过期" : "有效",
        },
      ]}
      data={backends}
      rowKey="id"
      pagination={false}
    />
  );
}
