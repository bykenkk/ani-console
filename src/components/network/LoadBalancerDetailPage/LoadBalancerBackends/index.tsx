import { loadBalancerListeners } from "@/lib/load-balancers";
import type { NetworkLoadBalancer, NetworkLoadBalancerBackend } from "@/api/network";
import { DataTable, StatusBadge } from "@/components/common";

export default function LoadBalancerBackends({ item }: { item: NetworkLoadBalancer }) {
  const backends = loadBalancerListeners(item).flatMap((listener) =>
    (listener.backends ?? []).map((backend) => ({
      ...backend,
      listenerName: listener.name || listener.id,
      rowId: listener.id + ":" + backend.id,
    })),
  );
  return (
    <DataTable<NetworkLoadBalancerBackend & { listenerName: string; rowId: string }>
      columns={[
        { title: "监听器", dataIndex: "listenerName", ellipsis: true },
        { title: "成员 ID", dataIndex: "id", ellipsis: true },
        { title: "地址", dataIndex: "address" },
        { title: "端口", dataIndex: "port" },
        { title: "权重", dataIndex: "weight" },
        { title: "子网", dataIndex: "subnet_id", ellipsis: true },
        {
          title: "状态",
          render: (_, row) => <StatusBadge status={row.state} reason={row.reason} />,
        },
      ]}
      data={backends}
      rowKey="rowId"
      pagination={false}
    />
  );
}
