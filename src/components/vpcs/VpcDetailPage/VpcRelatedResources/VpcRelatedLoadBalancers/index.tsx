import { StatusBadge } from "@/components/common";
import { listNetworkLoadBalancers, type NetworkLoadBalancer } from "@/api/network";
import { DataTable, ResourceNameId, type ListColumn } from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";

type VpcRelatedLoadBalancersProps = { vpcId: string };

export default function VpcRelatedLoadBalancers({ vpcId }: VpcRelatedLoadBalancersProps) {
  // TODO(pagination-migration): 负载均衡仅支持 limit/cursor，后端提供页码契约后迁移。
  const { query, items, pagination } = useCursorPaginatedQuery({
    queryKey: ["network-load-balancers", "vpc", vpcId],
    queryFn: (params, signal) => listNetworkLoadBalancers({ ...params, vpc_id: vpcId }, signal),
    errorNotification: {
      id: withId("vpc-load-balancers", vpcId),
      action: "负载均衡加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  const columns: Array<ListColumn<NetworkLoadBalancer>> = [
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
      render: (_, resource) => (
        <StatusBadge
          status={resource.state}
          reason={resource.reason}
          message={resource.reason_message}
        />
      ),
    },
  ];

  return (
    <DataTable<NetworkLoadBalancer>
      header={{ title: "负载均衡" }}
      columns={columns}
      data={items}
      loading={query.isFetching}
      pagination={pagination}
      tableLabel="VPC 负载均衡关联资源"
    />
  );
}
