import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listNetworkRoutes, type NetworkRoute } from "@/api/network";
import { DataTable } from "@/components/common";
import { withId } from "@/lib/id";

type VpcRoutesProps = { vpcId: string };

export default function VpcRoutes({ vpcId }: VpcRoutesProps) {
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
        { title: "目标 CIDR", width: 180, dataIndex: "destination_cidr" },
        { title: "下一跳类型", width: 140, dataIndex: "next_hop_type" },
        { title: "下一跳", width: 200, dataIndex: "next_hop_id" },
        { title: "描述", width: 320, dataIndex: "description" },
      ]}
      data={pageItems}
      loading={routes.isLoading}
      pagination={pagination}
    />
  );
}
