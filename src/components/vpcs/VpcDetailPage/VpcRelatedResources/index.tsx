import { useClientPagination } from "@/hooks/useClientPagination";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import NetworkAssociatedInstances from "@/components/network/NetworkAssociatedInstances";

import {
  listNetworkLoadBalancers,
  listNetworkSubnets,
  type NetworkLoadBalancer,
  type NetworkSubnet,
} from "@/api/network";
import { DataTable, ResourceNameId, StatusBadge, type ListColumn } from "@/components/common";
import { withId } from "@/lib/id";
import { Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";

type VpcRelatedResourcesProps = { vpcId: string };

type RelatedResource = {
  id: string;
  kind: "子网" | "负载均衡";
  name: string;
  status: string;
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
  const resources: RelatedResource[] = [
    ...((subnets.data?.items ?? []) as NetworkSubnet[]).map((item) => ({
      id: item.id,
      kind: "子网" as const,
      name: item.name,
      status: item.state,
    })),
    ...((loadBalancers.data?.items ?? []) as NetworkLoadBalancer[]).map((item) => ({
      id: item.id,
      kind: "负载均衡" as const,
      name: item.name,
      status: item.state,
    })),
  ];
  // 完整集合的旧网络列表保留本地分页，不与负载均衡的服务端当前页混算总数。
  const networkResources = resources.filter((resource) => resource.kind !== "负载均衡");
  const loadBalancerResources = resources.filter((resource) => resource.kind === "负载均衡");
  const networkPage = useClientPagination(networkResources, vpcId);
  const loading = subnets.isFetching || loadBalancers.isFetching;
  const columns: Array<ListColumn<RelatedResource>> = [
    {
      title: "名称 / ID",
      width: 200,
      ellipsis: true,
      render: (_, resource) => (
        <ResourceNameId name={resource.name || "-"} id={resource.id} openable={false} />
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_, resource) => <StatusBadge status={resource.status} />,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <section>
        <DataTable<RelatedResource>
          header={{
            title: "子网",
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
          header={{ title: "负载均衡" }}
          columns={columns}
          data={loadBalancerResources}
          loading={loadBalancers.isFetching}
          pagination={loadBalancerPagination}
          tableLabel="VPC 负载均衡关联资源"
        />
      </section>
      <section>
        <NetworkAssociatedInstances scope="vpc" resourceId={vpcId} />
      </section>
    </div>
  );
}
