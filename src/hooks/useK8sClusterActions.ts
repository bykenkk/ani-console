import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type K8sCluster } from "@/api/k8s-clusters";
import type { RowAction } from "@/components/common";
type Cluster = K8sCluster;
export function useK8sClusterActions(onDeleted?: (item: Cluster) => void) {
  const deleteCluster = useResourceDelete<Cluster>("k8s-cluster", onDeleted);
  const actions: RowAction<Cluster>[] = [
    {
      key: "delete",
      label: "删除",
      disabled: deleteCluster.isDisabled,
      loading: (item) => deleteCluster.isPending && deleteCluster.variables?.id === item.id,
      intent: "danger",
      onClick: (cluster) => deleteCluster.confirm(cluster),
    },
  ];
  return { actions };
}
