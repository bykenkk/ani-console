import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateNetworkLoadBalancer,
  getNetworkLoadBalancer,
  type NetworkLoadBalancer,
  type NetworkLoadBalancerListener,
  type NetworkLoadBalancerBackendInput,
} from "@/api/network";
import { listenerInput, listenerSetError, loadBalancerListeners } from "@/lib/load-balancers";
import { withId } from "@/lib/id";
import { ApiError } from "@/api/request";

type LoadBalancerConfigurationChange = {
  listeners: NetworkLoadBalancerListener[];
  channel: "message" | "notification";
};

function validConfigurationVersion(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n
  );
}

export function useLoadBalancerConfiguration(item: NetworkLoadBalancer) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ listeners }: LoadBalancerConfigurationChange) => {
      const error = listenerSetError(listeners);
      if (error) throw new Error(error);
      const baselineDesiredVersion = item.desired_version;
      const latest = await qc.fetchQuery({
        queryKey: ["network-load-balancer", item.id],
        queryFn: ({ signal }) => getNetworkLoadBalancer(item.id, signal),
        staleTime: 0,
      });
      if (
        !validConfigurationVersion(baselineDesiredVersion) ||
        !validConfigurationVersion(latest.desired_version)
      ) {
        await qc.invalidateQueries({ queryKey: ["network-load-balancers"] });
        throw new Error("缺少有效的配置版本，请刷新后核对重试");
      }
      if (latest.desired_version !== baselineDesiredVersion) {
        // The preflight GET already refreshed the detail; do not fetch it twice.
        await qc.invalidateQueries({ queryKey: ["network-load-balancers"] });
        throw new Error("资源已变化，请核对后重试");
      }
      if (!validConfigurationVersion(latest.version)) {
        throw new Error("缺少有效的资源版本，请刷新负载均衡后重试");
      }
      try {
        await updateNetworkLoadBalancer(item.id, {
          expected_version: latest.version,
          data: { listeners: { items: listeners.map(listenerInput) } },
          update_mask: "listeners",
        });
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.status !== 412 ||
          error.code !== "VERSION_CONFLICT"
        ) {
          throw error;
        }
        await Promise.allSettled([
          qc.invalidateQueries({ queryKey: ["network-load-balancer", item.id], exact: true }),
          qc.invalidateQueries({ queryKey: ["network-load-balancers"] }),
        ]);
        throw new ApiError("资源已变化，请核对后重试", {
          status: error.status,
          code: error.code,
          requestId: error.requestId,
          details: error.details,
          config: error.config,
          response: error.response,
          cause: error,
        });
      }
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
