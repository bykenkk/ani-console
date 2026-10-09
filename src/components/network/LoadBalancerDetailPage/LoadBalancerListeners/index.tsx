import type { NetworkLoadBalancerListener } from "@/api/network";
import { DataTable } from "@/components/common";

export default function LoadBalancerListeners({
  listeners,
}: {
  listeners: NetworkLoadBalancerListener[];
}) {
  return (
    <DataTable<NetworkLoadBalancerListener>
      columns={[
        { title: "协议", render: (_, row) => row.protocol.toUpperCase() },
        { title: "监听端口", dataIndex: "port" },
        { title: "目标端口", dataIndex: "target_port" },
      ]}
      data={listeners}
      rowKey={(row) => `${row.protocol}-${row.port}-${row.target_port}`}
      pagination={false}
    />
  );
}
