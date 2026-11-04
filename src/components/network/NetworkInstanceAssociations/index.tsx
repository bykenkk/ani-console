import { useQuery } from "@tanstack/react-query";
import { Typography } from "@arco-design/web-react";
import {
  listNetworkInstances,
  type NetworkAssociatedInstance,
  type NetworkConsumerType,
} from "@/api/network";
import { DataTable, ResourceNameId, StatusBadge, type ListColumn } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { withId } from "@/lib/id";
import NetworkResourceStatus from "../NetworkResourceStatus";

type NetworkInstanceAssociationsProps = { vpcId?: string; subnetId?: string };

const consumerLabels: Record<NetworkConsumerType, string> = {
  container_instance: "容器实例",
  virtual_machine: "虚拟机",
  sandbox: "沙箱",
  unknown: "未知",
};

export default function NetworkInstanceAssociations({
  vpcId,
  subnetId,
}: NetworkInstanceAssociationsProps) {
  const scope = withId("network-instances", vpcId, subnetId);
  const paging = useListPagination(scope, 20);
  const params = {
    vpc_id: vpcId,
    subnet_id: subnetId,
    page: paging.page,
    pageSize: paging.pageSize,
  };
  const instances = useQuery({
    queryKey: ["network-instances", params],
    queryFn: ({ signal }) => listNetworkInstances(params, signal),
    meta: { errorNotification: { id: scope, action: "网络关联实例加载" } },
  });
  const columns: Array<ListColumn<NetworkAssociatedInstance>> = [
    {
      title: "类型",
      width: 120,
      render: (_, item) => consumerLabels[item.consumer_type] ?? "未知",
    },
    {
      title: "名称 / ID",
      width: 200,
      render: (_, item) => (
        <ResourceNameId
          name={item.consumer_name || item.consumer_id}
          id={item.consumer_id}
          type={
            item.consumer_type === "virtual_machine"
              ? "vm-instance"
              : item.consumer_type === "sandbox"
                ? "sandbox-instance"
                : undefined
          }
        />
      ),
    },
    {
      title: "实例状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.consumer_state || "unknown"} />,
    },
    {
      title: "网络占用状态",
      width: 120,
      render: (_, item) => (
        <NetworkResourceStatus
          resource={{
            state: item.attachment_state,
            reason: item.attachment_reason,
            observation_stale: item.observation_stale,
            observed_at: item.observed_at,
          }}
        />
      ),
    },
    {
      title: "子网",
      width: 200,
      ellipsis: true,
      render: (_, item) => item.subnet_name || item.subnet_id,
    },
    {
      title: "地址",
      width: 240,
      ellipsis: true,
      render: (_, item) =>
        item.addresses.map(({ nic_name, address }) => `${nic_name}: ${address}`).join(" · ") || "-",
    },
  ];

  return (
    <DataTable
      header={{
        title: "网络关联实例",
        extra: <Typography.Text type="secondary">展示当前网络占用</Typography.Text>,
      }}
      rowKey="attachment_id"
      data={instances.data?.items ?? []}
      columns={columns}
      loading={instances.isFetching}
      tableLabel="网络关联实例"
      pagination={
        instances.data
          ? {
              mode: "total",
              page: paging.page,
              pageSize: paging.pageSize,
              total: Number(instances.data.total),
              disabled: instances.isFetching,
              onPageChange: paging.setPage,
              onPageSizeChange: paging.setPageSize,
            }
          : false
      }
    />
  );
}
