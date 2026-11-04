import { Tag } from "@arco-design/web-react";
import NetworkResourceStatus from "@/components/network/NetworkResourceStatus";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { listNetworkSubnets, type NetworkSubnet } from "@/api/network";
import { DataTable, ResourceNameId } from "@/components/common";
import { withId } from "@/lib/id";

type VpcSubnetsProps = { vpcId: string };

export default function VpcSubnets({ vpcId }: VpcSubnetsProps) {
  // TODO(pagination-migration): 子网仍使用 limit/cursor，后端迁移后改为页码分页。
  const {
    query: subnets,
    items: pageItems,
    pagination,
  } = useCursorPaginatedQuery({
    errorNotification: {
      id: withId("vpc-subnets", vpcId),
      action: `子网加载`,
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["network-subnets", vpcId],
    queryFn: (params, signal) => listNetworkSubnets({ ...params, vpc_id: vpcId }, signal),
  });

  return (
    <DataTable<NetworkSubnet>
      header={{ title: "子网关联" }}
      columns={[
        {
          title: "名称 / ID",
          width: 200,
          render: (_, item) => (
            <div className="flex flex-col items-start gap-1">
              <ResourceNameId name={item.name} id={item.id} type="subnet" />
              {item.owner_scope === "platform" && <Tag color="arcoblue">平台基础网络</Tag>}
            </div>
          ),
        },
        { title: "CIDR", width: 180, dataIndex: "cidr" },
        { title: "网关", width: 180, dataIndex: "gateway" },
        {
          title: "状态",
          width: 120,
          render: (_, item) => <NetworkResourceStatus resource={item} />,
        },
      ]}
      data={pageItems}
      loading={subnets.isFetching}
      pagination={pagination}
    />
  );
}
