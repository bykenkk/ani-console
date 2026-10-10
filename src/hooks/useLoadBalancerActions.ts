import { useResourceDelete } from "@/hooks/useResourceDelete";
import { useNavigate } from "@tanstack/react-router";
import { type NetworkLoadBalancer } from "@/api/network";
import { navigateToResourceDetail } from "@/lib/resources";
import type { RowAction } from "@/components/common";
type LoadBalancer = NetworkLoadBalancer;
export function useLoadBalancerActions(onDeleted: (item: LoadBalancer) => void) {
  const navigate = useNavigate();
  const deleteLoadBalancer = useResourceDelete<LoadBalancer>("load-balancer", onDeleted, {
    isDisabled: (item) => item.state === "deleting" || item.state === "deleted",
  });

  const actions: RowAction<LoadBalancer>[] = [
    {
      key: "listeners",
      label: "查看监听器",
      onClick: (item) => navigateToResourceDetail(navigate, { type: "load-balancer", id: item.id }),
    },
    {
      key: "backends",
      label: "查看后端",
      onClick: (item) => navigateToResourceDetail(navigate, { type: "load-balancer", id: item.id }),
    },
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
