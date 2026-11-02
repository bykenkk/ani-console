import { useResourceDelete } from "@/hooks/useResourceDelete";
import { type NetworkLoadBalancer } from "@/api/network";
import type { RowAction } from "@/components/common";
type LoadBalancer = NetworkLoadBalancer;
export function useLoadBalancerActions(onDeleted: (item: LoadBalancer) => void) {
  const deleteLoadBalancer = useResourceDelete<LoadBalancer>("load-balancer", onDeleted, {
    isDisabled: (item) => item.state === "deleting" || item.state === "deleted",
  });

  const actions: RowAction<LoadBalancer>[] = [
    {
      key: "delete",
      label: "删除",
      disabled: deleteLoadBalancer.isDisabled,
      loading: (item) =>
        deleteLoadBalancer.isPending && deleteLoadBalancer.variables?.id === item.id,
      intent: "danger",
      onClick: (item) => {
        deleteLoadBalancer.confirm(item);
      },
    },
  ];
  return { actions };
}
