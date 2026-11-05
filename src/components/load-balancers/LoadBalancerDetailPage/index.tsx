import NetworkResourceStatus from "@/components/network/NetworkResourceStatus";
import { useLoadBalancerActions } from "@/hooks/useLoadBalancerActions";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import { DetailPageFrame, DetailPagePlaceholder, AliIcon, ResourceId } from "@/components/common";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNetworkLoadBalancer,
  updateNetworkLoadBalancer,
  getNetworkSubnet,
  getNetworkVpc,
  type NetworkLoadBalancer,
  type NetworkLoadBalancerListener,
  type NetworkLoadBalancerBackendInput,
  type NetworkSubnet,
  type NetworkVPC,
} from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import {
  listenerInput,
  listenerSetError,
  loadBalancerLabel,
  loadBalancerListeners,
} from "@/lib/load-balancers";
import { ApiError } from "@/api/request";
import VpcBaseConnectivityStatus from "@/components/vpcs/VpcBaseConnectivityStatus";
import LoadBalancerBackends from "./LoadBalancerBackends";
// TODO(feature-visibility): 待负载均衡事件支持后恢复此组件导入。
// import LoadBalancerEvents from "./LoadBalancerEvents";
import LoadBalancerListeners from "./LoadBalancerListeners";
// TODO(feature-visibility): 待负载均衡监控支持后恢复此组件导入。
// import LoadBalancerMonitoring from "./LoadBalancerMonitoring";

type LoadBalancerDetailPageProps = {
  loadBalancerId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};

type LoadBalancer = NetworkLoadBalancer;
type Vpc = NetworkVPC;
type Subnet = NetworkSubnet;

type LoadBalancerConfigurationChange = {
  item: NetworkLoadBalancer;
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

export default function LoadBalancerDetailPage({
  loadBalancerId,
  tab,
  onTabChange,
}: LoadBalancerDetailPageProps) {
  const goBack = useBackOrFallback("load-balancer");
  const qc = useQueryClient();
  const detail = useQuery({
    meta: {
      errorNotification: {
        id: withId("load-balancer", loadBalancerId),
        action: `负载均衡加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-load-balancer", loadBalancerId],
    queryFn: ({ signal }) => getNetworkLoadBalancer(loadBalancerId, signal),
  });
  const vpc = useQuery({
    meta: {
      errorNotification: {
        id: withId("load-balancer-vpc", loadBalancerId),
        action: `VPC 加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpc", detail.data?.vpc_id],
    queryFn: () => getNetworkVpc(detail.data!.vpc_id),
    enabled: Boolean(detail.data?.vpc_id),
  });
  const subnet = useQuery({
    meta: {
      errorNotification: {
        id: withId("load-balancer-subnet", loadBalancerId),
        action: `子网加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-subnet", detail.data?.subnet_id],
    queryFn: () => getNetworkSubnet(detail.data!.subnet_id!),
    enabled: Boolean(detail.data?.subnet_id),
  });
  const updateConfiguration = useMutation({
    mutationFn: async ({ item, listeners }: LoadBalancerConfigurationChange) => {
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
        const { item, channel } = variables as LoadBalancerConfigurationChange;
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
    onSuccess: async (_, { item }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-load-balancer", item.id], exact: true }),
        qc.invalidateQueries({ queryKey: ["network-load-balancers"] }),
      ]);
    },
  });
  const { actions } = useLoadBalancerActions(goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const item = detail.data as LoadBalancer;
  const saveConfiguration = (
    listeners: NetworkLoadBalancerListener[],
    channel: LoadBalancerConfigurationChange["channel"] = "message",
  ) => updateConfiguration.mutateAsync({ item, listeners, channel });
  const saveBackends = (
    listenerId: string,
    backends: NetworkLoadBalancerBackendInput[],
    channel: LoadBalancerConfigurationChange["channel"] = "message",
  ) =>
    saveConfiguration(
      loadBalancerListeners(item).map((listener) => {
        const input = listenerInput(listener);
        return listener.id === listenerId ? { ...input, backends } : input;
      }),
      channel,
    );
  const parentVpc = vpc.data as Vpc | undefined;
  const parentSubnet = subnet.data as Subnet | undefined;
  const relatedLoading = vpc.isLoading || subnet.isLoading;
  const summaryItems = [
    ...(parentVpc
      ? [
          {
            id: parentVpc.id,
            kind: "VPC",
            name: parentVpc.name,
            type: "vpc" as const,
          },
        ]
      : []),
    ...(parentSubnet
      ? [
          {
            id: parentSubnet.id,
            kind: "子网",
            name: parentSubnet.name,
            type: "subnet" as const,
          },
        ]
      : []),
  ];
  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/load-balancers"), { label: item.name }]}
      title={item.name}
      status={<NetworkResourceStatus resource={item} />}
      icon={<AliIcon name="fuzaijunhengqi" size={28} />}
      headerItems={[{ label: "IP 地址", value: item.private_ip || "-" }]}
      actions={<ResourceActionMenu record={item} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={item.id} /> },
            { label: "IP 地址", value: item.private_ip || "-" },
            {
              label: "类型",
              value: loadBalancerLabel(item.exposure),
            },
            {
              label: "VPC",
              value: parentVpc?.name ?? <ResourceId value={item.vpc_id} />,
            },
            {
              label: "基础网络",
              value: parentVpc ? (
                <VpcBaseConnectivityStatus connectivity={parentVpc.base_connectivity} />
              ) : (
                "-"
              ),
            },
            {
              label: "子网",
              value: parentSubnet?.name ?? <ResourceId value={item.subnet_id} />,
            },
            { label: "描述", value: item.description || "-" },
            { label: "公网 IP", value: item.public_address || "-" },
            { label: "规格", value: item.flavor || "-" },
            { label: "流量健康", value: loadBalancerLabel(item.data_plane_state) },
            {
              label: "流量观测时间",
              value: item.data_plane_observed_at
                ? formatDateTime(item.data_plane_observed_at)
                : "-",
            },
            { label: "创建时间", value: formatDateTime(item.created_at) },
            { label: "更新时间", value: formatDateTime(item.updated_at) },
          ],
        },
        {
          key: "related-summary",
          title: "关联摘要",
          fields: relatedLoading
            ? [{ label: "加载中…", value: "-" }]
            : summaryItems.length
              ? summaryItems.map((related) => ({
                  label: related.kind,
                  value: related.name,
                }))
              : [{ label: "暂无关联对象", value: "-" }],
        },
      ]}
      tabs={[
        {
          key: "listeners",
          label: "监听器",
          content: (
            <LoadBalancerListeners
              item={item}
              pending={updateConfiguration.isPending}
              onSave={saveConfiguration}
            />
          ),
        },
        {
          key: "backends",
          label: "后端组",
          content: (
            <LoadBalancerBackends
              item={item}
              pending={updateConfiguration.isPending}
              onSave={saveBackends}
            />
          ),
        },
        // TODO(feature-visibility): 待负载均衡监控支持后恢复此 Tab 入口。
        // {
        //   key: "metrics",
        //   label: "监控",
        //   content: <LoadBalancerMonitoring />,
        // },
        // TODO(feature-visibility): 待负载均衡事件支持后恢复此 Tab 入口。
        // {
        //   key: "events",
        //   label: "事件",
        //   content: <LoadBalancerEvents />,
        // },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}
