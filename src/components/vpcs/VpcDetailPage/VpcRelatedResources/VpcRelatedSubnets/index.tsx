import { Tag } from "@arco-design/web-react";
import { listNetworkSubnets, type NetworkSubnet } from "@/api/network";
import { DataTable, ResourceNameId, type ListColumn } from "@/components/common";
import NetworkResourceStatus from "@/components/network/NetworkResourceStatus";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";

type VpcRelatedSubnetsProps = { vpcId: string };

export default function VpcRelatedSubnets({ vpcId }: VpcRelatedSubnetsProps) {
  // TODO(pagination-migration): 子网仍使用 limit/cursor，后端迁移后改为页码分页。
  const { query, items, pagination } = useCursorPaginatedQuery({
    queryKey: ["network-subnets", vpcId],
    queryFn: (params, signal) => listNetworkSubnets({ ...params, vpc_id: vpcId }, signal),
    errorNotification: {
      id: withId("vpc-subnets", vpcId),
      action: "子网加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  const columns: Array<ListColumn<NetworkSubnet>> = [
    {
      title: "名称 / ID",
      width: 200,
      ellipsis: true,
      render: (_, resource) => (
        <div className="flex flex-col items-start gap-1">
          <ResourceNameId name={resource.name || "-"} id={resource.id} openable={false} />
          {resource?.owner_scope === "platform" && <Tag color="arcoblue">平台基础网络</Tag>}
        </div>
      ),
    },
    { title: "CIDR", width: 180, ellipsis: true, dataIndex: "cidr" },
    { title: "网关", width: 180, ellipsis: true, dataIndex: "gateway" },
    {
      title: "状态",
      width: 120,
      render: (_, resource) => <NetworkResourceStatus resource={resource} />,
    },
  ];

  return (
    <DataTable<NetworkSubnet>
      header={{ title: "子网" }}
      columns={columns}
      data={items}
      loading={query.isFetching}
      pagination={pagination}
      tableLabel="VPC 网络关联资源"
    />
  );
}
