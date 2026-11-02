import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateNetworkLoadBalancer,
  type NetworkLoadBalancer,
  type NetworkLoadBalancerListener,
  type NetworkLoadBalancerBackendInput,
} from "@/api/network";
import { listenerInput, listenerSetError, loadBalancerListeners } from "@/lib/load-balancers";
import { withId } from "@/lib/id";

type LoadBalancerConfigurationChange = {
  listeners: NetworkLoadBalancerListener[];
  channel: "message" | "notification";
};

export function useLoadBalancerConfiguration(item: NetworkLoadBalancer) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ listeners }: LoadBalancerConfigurationChange) => {
      const error = listenerSetError(listeners);
      if (error) throw new Error(error);
      if (!item.version) throw new Error("缺少资源版本，请刷新负载均衡后重试");
      return updateNetworkLoadBalancer(item.id, {
        expected_version: item.version,
        data: { listeners: { items: listeners.map(listenerInput) } },
        update_mask: "listeners",
      });
    },
    meta: {
      feedback: (variables) => {
        const { channel } = variables as LoadBalancerConfigurationChange;
        const feedback = {
          action: "更新负载均衡配置",
          successText: "负载均衡配置更新已提交",
          errorFallback: "更新失败，请刷新后重试",
        };
        return channel === "notification"
          ? { ...feedback, channel, id: withId("load-balancer-update", item.id) }
          : { ...feedback, channel };
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-load-balancer", item.id], exact: true }),
        qc.invalidateQueries({ queryKey: ["network-load-balancers"] }),
      ]);
    },
  });
  return {
    save: (
      listeners: NetworkLoadBalancerListener[],
      channel: LoadBalancerConfigurationChange["channel"] = "message",
    ) => mutation.mutateAsync({ listeners, channel }),
    saveBackends: (
      listenerId: string,
      backends: NetworkLoadBalancerBackendInput[],
      channel: LoadBalancerConfigurationChange["channel"] = "message",
    ) =>
      mutation.mutateAsync({
        channel,
        listeners: loadBalancerListeners(item).map((listener) => {
          const input = listenerInput(listener);
          return listener.id === listenerId ? { ...input, backends } : input;
        }),
      }),
    pending: mutation.isPending,
  };
}
