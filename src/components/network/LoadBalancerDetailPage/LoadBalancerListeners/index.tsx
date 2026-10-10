import type { NetworkLoadBalancerListenerResource } from "@/api/network";
import { DataTable } from "@/components/common";
import { loadBalancerLabel } from "@/lib/load-balancers";

export default function LoadBalancerListeners({
  listener,
}: {
  listener?: NetworkLoadBalancerListenerResource;
}) {
  return (
    <DataTable<NetworkLoadBalancerListenerResource>
      columns={[
        { title: "ID", dataIndex: "id", ellipsis: true },
        { title: "协议", render: (_, row) => loadBalancerLabel(row.protocol) },
        { title: "监听端口", dataIndex: "port" },
      ]}
      data={listener ? [listener] : []}
      rowKey="id"
      pagination={false}
    />
  );
}
