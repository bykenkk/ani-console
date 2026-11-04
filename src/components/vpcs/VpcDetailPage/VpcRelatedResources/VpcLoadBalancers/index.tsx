import { listNetworkLoadBalancers } from "@/api/network";
import { DataTable, ResourceNameId } from "@/components/common";
import NetworkResourceStatus from "@/components/network/NetworkResourceStatus";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";

type VpcLoadBalancersProps = { vpcId: string };

export default function VpcLoadBalancers({ vpcId }: VpcLoadBalancersProps) {
  // TODO(pagination-migration): 负载均衡仍使用 limit/cursor，待后端改为页码契约后迁移。
  const { query, items, pagination } = useCursorPaginatedQuery({
    queryKey: ["network-load-balancers", "vpc", vpcId],
    queryFn: (params, signal) => listNetworkLoadBalancers({ ...params, vpc_id: vpcId }, signal),
    errorNotification: { id: withId("vpc-load-balancers", vpcId), action: "负载均衡加载" },
  });
  return (
    <DataTable
      header={{ title: "负载均衡关联" }}
      data={items}
      loading={query.isFetching}
      pagination={pagination}
      tableLabel="VPC 负载均衡关联资源"
      columns={[
        {
          title: "名称 / ID",
          width: 200,
          render: (_, item) => (
            <ResourceNameId name={item.name} id={item.id} type="load-balancer" />
          ),
        },
        {
          title: "状态",
          width: 120,
          render: (_, item) => <NetworkResourceStatus resource={item} />,
        },
      ]}
    />
  );
}
