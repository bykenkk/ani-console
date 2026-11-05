import { listNetworkVpcAssociatedInstances, type NetworkAssociatedInstance } from "@/api/network";
import { DataTable, ResourceNameId, StatusBadge, type ListColumn } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { withId } from "@/lib/id";
import { Tag } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";

type VpcAssociatedInstancesProps = { vpcId: string };

const consumerLabels: Record<NetworkAssociatedInstance["consumer_type"], string> = {
  container_instance: "容器实例",
  virtual_machine: "云主机",
  sandbox: "沙箱",
  unknown: "未知",
};

const columns: Array<ListColumn<NetworkAssociatedInstance>> = [
  {
    title: "名称 / ID",
    width: 200,
    ellipsis: true,
    fixed: "left",
    render: (_, item) => (
      <ResourceNameId name={item.consumer_name || "-"} id={item.consumer_id} openable={false} />
    ),
  },
  {
    title: "类型",
    width: 120,
    render: (_, item) => <Tag>{consumerLabels[item.consumer_type] ?? item.consumer_type}</Tag>,
  },
  {
    title: "状态",
    width: 120,
    render: (_, item) => <StatusBadge status={item.consumer_state} />,
  },
  {
    title: "IP 地址",
    width: 240,
    ellipsis: true,
    render: (_, item) => item.addresses.map(({ address }) => address).join(" · ") || "-",
  },
];

export default function VpcAssociatedInstances({ vpcId }: VpcAssociatedInstancesProps) {
  const paging = useListPagination(withId("vpc-associated-instances", vpcId), 20);
  const params = { page: paging.page, pageSize: paging.pageSize };
  const instances = useQuery({
    queryKey: ["vpc-associated-instances", vpcId, params],
    queryFn: ({ signal }) => listNetworkVpcAssociatedInstances(vpcId, params, signal),
    meta: {
      errorNotification: {
        id: withId("vpc-associated-instances", vpcId),
        action: "关联实例加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });

  return (
    <DataTable<NetworkAssociatedInstance>
      header={{ title: "实例" }}
      rowKey="attachment_id"
      columns={columns}
      data={instances.data?.items ?? []}
      loading={instances.isFetching}
      pagination={{
        ...params,
        total: Number(instances.data?.total ?? "0"),
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
      tableLabel="VPC 关联实例"
    />
  );
}
