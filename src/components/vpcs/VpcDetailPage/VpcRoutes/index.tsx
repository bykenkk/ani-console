import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listNetworkRoutes, type NetworkRoute } from "@/api/network";
import { DataTable } from "@/components/common";
import { withId } from "@/lib/id";

export default function VpcRoutes({ vpcId }: { vpcId: string }) {
  const {
    query: routes,
    items: pageItems,
    pagination,
  } = useClientPaginatedQuery({
    errorNotification: {
      id: withId("vpc-routes", vpcId),
      action: `路由加载`,
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-routes", vpcId],
    queryFn: () => listNetworkRoutes({ vpc_id: vpcId }),
  });

  return (
    <DataTable<NetworkRoute>
      columns={[
        { title: "目标 CIDR", dataIndex: "destination_cidr" },
        { title: "下一跳类型", dataIndex: "next_hop_type" },
        { title: "下一跳", dataIndex: "next_hop_id" },
        { title: "描述", dataIndex: "description", placeholder: "-" },
      ]}
      data={pageItems}
      loading={routes.isLoading}
      pagination={pagination}
    />
  );
}
