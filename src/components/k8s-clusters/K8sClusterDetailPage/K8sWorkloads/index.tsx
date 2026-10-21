import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listK8sClusterWorkloads, type K8sClusterWorkload } from "@/api/k8s-clusters";
import { DataTable, StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";
import { Card, Grid } from "@arco-design/web-react";

type K8sWorkloadsProps = { clusterId: string };

export default function K8sWorkloads({ clusterId }: K8sWorkloadsProps) {
  const {
    query: workloads,
    items: pageItems,
    pagination,
  } = useClientPaginatedQuery({
    errorNotification: {
      id: withId("k8s-workloads", clusterId),
      action: "工作负载加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["k8s-workloads", clusterId],
    queryFn: () => listK8sClusterWorkloads(clusterId),
  });
  const items = (workloads.data?.items ?? []) as K8sClusterWorkload[];
  const deploymentCount = items.filter((item) => item.kind === "Deployment").length;
  const podCount = items.reduce((total, item) => total + Number(item.ready_replicas ?? 0), 0);

  return (
    <div>
      <Grid.Row gutter={16} className="mb-4">
        <Grid.Col span={8}>
          <Card title="Deployments">{deploymentCount}</Card>
        </Grid.Col>
        <Grid.Col span={8}>
          <Card title="Pods">{podCount}</Card>
        </Grid.Col>
        <Grid.Col span={8}>
          <Card title="Services">0</Card>
        </Grid.Col>
      </Grid.Row>
      <DataTable<K8sClusterWorkload>
        columns={[
          { title: "名称", width: 200, dataIndex: "name" },
          { title: "类型", width: 140, dataIndex: "kind" },
          { title: "命名空间", width: 200, dataIndex: "namespace" },
          { title: "副本", width: 100, dataIndex: "replicas" },
          { title: "就绪副本", width: 100, dataIndex: "ready_replicas" },
          {
            title: "状态",
            width: 120,
            render: (_, row) => <StatusBadge status={row.status} />,
          },
        ]}
        data={pageItems}
        loading={workloads.isLoading}
        rowKey={(row) => `${row.namespace}/${row.kind}/${row.name}`}
        pagination={pagination}
      />
    </div>
  );
}
