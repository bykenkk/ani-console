import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listK8sClusterNodePools, type K8sClusterNodePool } from "@/api/k8s-clusters";
import { DataTable, StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";
import { useEffect } from "react";

export default function K8sNodePools({
  clusterId,
  onNodeCountChange,
}: {
  clusterId: string;
  onNodeCountChange: (count: number) => void;
}) {
  const {
    query: nodePools,
    items: pageItems,
    pagination,
  } = useClientPaginatedQuery({
    errorNotification: {
      id: withId("k8s-node-pools", clusterId),
      action: "节点池加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["k8s-node-pools", clusterId],
    queryFn: () => listK8sClusterNodePools(clusterId),
  });
  const items = (nodePools.data?.items ?? []) as K8sClusterNodePool[];
  const nodeCount = items.reduce((total, pool) => total + Number(pool.node_count ?? 0), 0);

  useEffect(() => {
    onNodeCountChange(nodeCount);
  }, [nodeCount, onNodeCountChange]);

  return (
    <DataTable<K8sClusterNodePool>
      columns={[
        { title: "名称", dataIndex: "name" },
        { title: "规格", dataIndex: "instance_type" },
        {
          title: "状态",
          width: 120,
          render: (_, row) => <StatusBadge status={row.state} />,
        },
      ]}
      data={pageItems}
      loading={nodePools.isLoading}
      pagination={pagination}
    />
  );
}
