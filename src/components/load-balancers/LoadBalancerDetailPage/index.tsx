import { useLoadBalancerActions } from "@/hooks/useLoadBalancerActions";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";

import { withId } from "@/lib/id";
import {
  DetailPageFrame,
  DetailPagePlaceholder,
  AliIcon,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { useQuery } from "@tanstack/react-query";

import {
  getNetworkLoadBalancer,
  getNetworkSubnet,
  getNetworkVpc,
  type NetworkLoadBalancer,
  type NetworkSubnet,
  type NetworkVPC,
} from "@/api/network";

import { formatDateTime } from "@/lib/format";
import { navigationBreadcrumbsForPath } from "@/components/layouts/AppLayout/navigation";
import { loadBalancerLabel } from "@/lib/load-balancers";
import LoadBalancerBackends from "./LoadBalancerBackends";
import LoadBalancerEvents from "./LoadBalancerEvents";
import LoadBalancerListeners from "./LoadBalancerListeners";
import LoadBalancerMonitoring from "./LoadBalancerMonitoring";

type LoadBalancer = NetworkLoadBalancer;
type Vpc = NetworkVPC;
type Subnet = NetworkSubnet;

export default function LoadBalancerDetailPage({
  loadBalancerId,
  tab,
  onTabChange,
}: {
  loadBalancerId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
}) {
  const goBack = useBackOrFallback("load-balancer");
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
  const { actions } = useLoadBalancerActions(goBack);
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const item = detail.data as LoadBalancer;
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
      status={
        <StatusBadge status={item.state} reason={item.reason} message={item.reason_message} />
      }
      icon={<AliIcon name="fuzaijunhengqi" size={28} />}
      headerItems={[{ label: "私网 IP", value: item.private_ip || "-" }]}
      actions={<ResourceActionMenu record={item} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={item.id} /> },
            { label: "私网 IP", value: item.private_ip || "-" },
            {
              label: "类型",
              value: loadBalancerLabel(item.exposure),
            },
            { label: "VPC", value: parentVpc?.name ?? item.vpc_id },
            {
              label: "子网",
              value: parentSubnet?.name ?? item.subnet_id ?? "-",
            },
            { label: "描述", value: item.description || "-" },
            { label: "公网 IP", value: item.public_address || "-" },
            { label: "规格", value: item.flavor || "-" },
            { label: "配置状态", value: loadBalancerLabel(item.configuration_state) },
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
          content: <LoadBalancerListeners item={item} />,
        },
        {
          key: "backends",
          label: "后端组",
          content: <LoadBalancerBackends item={item} />,
        },
        {
          key: "metrics",
          label: "监控",
          content: <LoadBalancerMonitoring />,
        },
        {
          key: "events",
          label: "事件",
          content: <LoadBalancerEvents />,
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}
