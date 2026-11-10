import { useQuery } from "@tanstack/react-query";
import { listNetworkVnics } from "@/api/network";
import { DataTable, ResourceIdentity, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { withId } from "@/lib/id";

type SubnetVnicsProps = { subnetId: string };
export default function SubnetVnics({ subnetId }: SubnetVnicsProps) {
  const paging = useListPagination(subnetId, 20);
  const vnics = useQuery({
    queryKey: ["network-vnics", { subnetId, page: paging.page, pageSize: paging.pageSize }],
    queryFn: ({ signal }) =>
      listNetworkVnics(
        { subnet_id: subnetId, page: paging.page, pageSize: paging.pageSize },
        signal,
      ),
    meta: {
      errorNotification: { id: withId("subnet-vnics", subnetId), action: "子网关联虚拟网卡加载" },
    },
  });
  return (
    <DataTable
      header={{ title: "虚拟网卡" }}
      data={vnics.data?.items ?? []}
      loading={vnics.isFetching}
      tableLabel="子网关联虚拟网卡"
      columns={[
        {
          title: "名称 / ID",
          width: 200,
          render: (_, vnic) => <ResourceIdentity name={vnic.name} id={vnic.id} openable={false} />,
        },
        {
          title: "分配状态",
          width: 120,
          render: (_, vnic) => <StatusBadge status={vnic.state} reason={vnic.reason} />,
        },
        {
          title: "地址",
          width: 220,
          render: (_, vnic) => vnic.ips?.join(" · ") || vnic.primary_ip || "-",
        },
        {
          title: "使用状态",
          width: 180,
          render: (_, vnic) => (vnic.bindings?.length ? "使用或预留中" : "空闲，仍占用子网"),
        },
      ]}
      pagination={{
        page: paging.page,
        pageSize: paging.pageSize,
        total: Number(vnics.data?.total ?? "0"),
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
    />
  );
}
