import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listNetworkSubnets, type NetworkSubnet } from "@/api/network";
import { DataTable, StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";

type VpcSubnetsProps = { vpcId: string };

export default function VpcSubnets({ vpcId }: VpcSubnetsProps) {
  const {
    query: subnets,
    items: pageItems,
    pagination,
  } = useClientPaginatedQuery({
    errorNotification: {
      id: withId("vpc-subnets", vpcId),
      action: `子网加载`,
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-subnets", vpcId],
    queryFn: () => listNetworkSubnets({ vpc_id: vpcId }),
  });

  return (
    <DataTable<NetworkSubnet>
      columns={[
        { title: "名称", dataIndex: "name" },
        { title: "CIDR", dataIndex: "cidr" },
        { title: "网关", dataIndex: "gateway", placeholder: "-" },
        {
          title: "状态",
          width: 120,
          render: (_, item) => <StatusBadge status={item.state} />,
        },
      ]}
      data={pageItems}
      loading={subnets.isLoading}
      pagination={pagination}
    />
  );
}
