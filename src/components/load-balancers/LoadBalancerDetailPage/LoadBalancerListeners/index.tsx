import type { NetworkLoadBalancer, NetworkLoadBalancerListenerResource } from "@/api/network";
import { DataTable, ResourceNameId } from "@/components/common";
import { loadBalancerLabel } from "@/lib/load-balancers";
import { loadBalancerListeners } from "@/lib/load-balancers";

type LoadBalancerListenersProps = { item: NetworkLoadBalancer };

export default function LoadBalancerListeners({ item }: LoadBalancerListenersProps) {
  return (
    <DataTable<NetworkLoadBalancerListenerResource>
      columns={[
        {
          title: "名称 / ID",
          fixed: "left",
          width: 150,
          render: (_, row) => (
            <ResourceNameId name={row.name || "-"} id={row.id} openable={false} />
          ),
        },
        {
          title: "协议",
          width: 90,
          render: (_, row) => loadBalancerLabel(row.protocol),
        },
        {
          title: "端口",
          width: 90,
          dataIndex: "port",
        },
        {
          title: "算法",
          width: 120,
          render: (_, row) => loadBalancerLabel(row.algorithm),
        },
        {
          title: "后端数",
          width: 90,
          render: (_, row) => row.backends?.length ?? 0,
        },
        {
          title: "健康检查",
          width: 110,
          render: (_, row) =>
            row.https_redirect_status_code ? "-" : loadBalancerLabel(row.health_check?.protocol),
        },
        {
          title: "会话保持",
          width: 180,
          render: (_, row) => loadBalancerLabel(row.session_persistence?.mode),
        },
        {
          title: "连接限制",
          width: 130,
          dataIndex: "max_connections",
        },
        {
          title: "gzip",
          width: 80,
          render: (_, row) => (row.gzip_enabled ? "开启" : "关闭"),
        },
        {
          title: "重定向",
          width: 90,
          render: (_, row) => row.https_redirect_status_code || "-",
        },
        {
          title: "证书",
          width: 180,
          dataIndex: "certificate_ref.name",
          ellipsis: true,
          placeholder: "-",
        },
      ]}
      data={loadBalancerListeners(item)}
      rowKey="id"
      pagination={false}
      tableLabel="负载均衡监听器"
    />
  );
}
