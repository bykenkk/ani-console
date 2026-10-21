// FIXME(governance-instance-associations): VPC 关联实例仍依赖旧 vpc_id 筛选、kind 及列表响应，保留原组件、入口和 legacy 调用。
// TODO(governance-instance-associations): 等新关联契约齐备后逐项迁移，不影响沙箱、虚拟机等未迁移实例。
import { listInstances, type InstanceRecord } from "@/api/instances/legacy";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";

import {
  listNetworkLoadBalancers,
  listNetworkRoutes,
  listNetworkSecurityGroups,
  listNetworkSubnets,
  type NetworkLoadBalancer,
  type NetworkRoute,
  type NetworkSecurityGroup,
  type NetworkSubnet,
} from "@/api/network";
import { DataTable, StatusBadge, type ListColumn } from "@/components/common";
import { withId } from "@/lib/id";
import { Space, Tag, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";

type VpcRelatedResourcesProps = { vpcId: string };

type RelatedResource = {
  id: string;
  kind: "子网" | "安全组" | "路由" | "负载均衡" | "实例";
  name: string;
  status: string;
  group: "网络" | "算力";
};

export default function VpcRelatedResources({ vpcId }: VpcRelatedResourcesProps) {
  const subnets = useQuery({
    meta: {
      errorNotification: {
        id: withId("vpc-subnets", vpcId),
        action: `子网加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-subnets", vpcId],
    queryFn: () => listNetworkSubnets({ vpc_id: vpcId }),
  });
  const routes = useQuery({
    meta: {
      errorNotification: {
        id: withId("vpc-routes", vpcId),
        action: `路由加载`,
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-routes", vpcId],
    queryFn: () => listNetworkRoutes({ vpc_id: vpcId }),
  });
  const securityGroups = useQuery({
    meta: {
      errorNotification: {
        id: withId("vpc-security-groups", vpcId),
        action: "安全组加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-security-groups", "vpc-related", vpcId],
    queryFn: () => listNetworkSecurityGroups({ vpc_id: vpcId }),
  });
  // TODO(pagination-migration): 负载均衡仅支持 limit/cursor，暂独立分页；后端提供统一关联页码契约后移除此兼容。
  const { query: loadBalancers, pagination: loadBalancerPagination } = useCursorPaginatedQuery({
    queryKey: ["network-load-balancers", "vpc", vpcId],
    queryFn: (params, signal) => listNetworkLoadBalancers({ ...params, vpc_id: vpcId }, signal),
    errorNotification: {
      id: withId("vpc-load-balancers", vpcId),
      action: "负载均衡加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  // TODO(pagination-migration): legacy 实例列表暂用 limit/cursor；新关联契约支持 page/pageSize 后移除此兼容。
  const { query: instances, pagination: instancePagination } = useCursorPaginatedQuery({
    queryKey: ["instances", "vpc", vpcId],
    queryFn: (params) => listInstances({ ...params, vpc_id: vpcId }),
    errorNotification: {
      id: withId("vpc-instances", vpcId),
      action: "关联实例加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  const resources: RelatedResource[] = [
    ...((subnets.data?.items ?? []) as NetworkSubnet[]).map((item) => ({
      id: item.id,
      kind: "子网" as const,
      name: item.name,
      status: item.state,
      group: "网络" as const,
    })),
    ...((securityGroups.data?.items ?? []) as NetworkSecurityGroup[]).map((item) => ({
      id: item.id,
      kind: "安全组" as const,
      name: item.name,
      status: item.state,
      group: "网络" as const,
    })),
    ...((routes.data?.items ?? []) as NetworkRoute[]).map((item) => ({
      id: item.id,
      kind: "路由" as const,
      name: item.description || item.destination_cidr,
      status: "-",
      group: "网络" as const,
    })),
    ...((loadBalancers.data?.items ?? []) as NetworkLoadBalancer[]).map((item) => ({
      id: item.id,
      kind: "负载均衡" as const,
      name: item.name,
      status: item.state,
      group: "网络" as const,
    })),
    ...((instances.data?.items ?? []) as InstanceRecord[]).map((item) => ({
      id: item.id,
      kind: "实例" as const,
      name: item.name,
      status: item.state,
      group: "算力" as const,
    })),
  ];
  // 完整集合的旧网络列表保留本地分页，不与负载均衡的服务端当前页混算总数。
  const networkResources = resources.filter(
    (resource) => resource.group === "网络" && resource.kind !== "负载均衡",
  );
  const loadBalancerResources = resources.filter((resource) => resource.kind === "负载均衡");
  const computeResources = resources.filter((resource) => resource.group === "算力");
  const networkPage = useClientPagination(networkResources, vpcId);
  const loading =
    subnets.isLoading ||
    routes.isLoading ||
    securityGroups.isLoading ||
    loadBalancers.isLoading ||
    instances.isLoading;
  const columns: Array<ListColumn<RelatedResource>> = [
    { title: "类型", width: 120, render: (_, resource) => <Tag>{resource.kind}</Tag> },
    { title: "名称", width: 200, dataIndex: "name" },
    { title: "资源 ID", width: 280, dataIndex: "id" },
    {
      title: "状态",
      width: 120,
      render: (_, resource) => <StatusBadge status={resource.status} />,
    },
  ];

  return (
    <Space direction="vertical" size={24} className="w-full">
      <section>
        <DataTable<RelatedResource>
          header={{
            title: "网络关联",
            extra: <Typography.Text type="secondary">{networkResources.length} 个</Typography.Text>,
          }}
          columns={columns}
          data={networkPage.items}
          loading={loading}
          pagination={networkPage.pagination}
          tableLabel="VPC 网络关联资源"
        />
      </section>
      <section>
        <DataTable<RelatedResource>
          header={{ title: "负载均衡关联" }}
          columns={columns}
          data={loadBalancerResources}
          loading={loadBalancers.isLoading}
          pagination={loadBalancerPagination}
          tableLabel="VPC 负载均衡关联资源"
        />
      </section>
      <section>
        <DataTable<RelatedResource>
          header={{
            title: "算力关联",
            extra: (
              <Typography.Text type="secondary">共 {instances.data?.total ?? 0} 个</Typography.Text>
            ),
          }}
          columns={columns}
          data={computeResources}
          loading={loading}
          pagination={instancePagination}
          tableLabel="VPC 算力关联资源"
        />
      </section>
    </Space>
  );
}
