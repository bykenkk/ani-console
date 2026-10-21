import { loadBalancerListeners } from "@/lib/load-balancers";
import type { NetworkLoadBalancer, NetworkLoadBalancerBackend } from "@/api/network";
import { DataTable, StatusBadge } from "@/components/common";

type LoadBalancerBackendsProps = { item: NetworkLoadBalancer };

export default function LoadBalancerBackends({ item }: LoadBalancerBackendsProps) {
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
        { title: "监听器", width: 200, dataIndex: "listenerName", ellipsis: true },
        { title: "成员 ID", width: 280, dataIndex: "id", ellipsis: true },
        { title: "地址", width: 180, dataIndex: "address" },
        { title: "端口", width: 100, dataIndex: "port" },
        { title: "权重", width: 100, dataIndex: "weight" },
        { title: "子网", width: 200, dataIndex: "subnet_id", ellipsis: true },
        {
          title: "状态",
          width: 120,
          render: (_, row) => <StatusBadge status={row.state} reason={row.reason} />,
        },
      ]}
      data={backends}
      rowKey="rowId"
      pagination={false}
    />
  );
}
