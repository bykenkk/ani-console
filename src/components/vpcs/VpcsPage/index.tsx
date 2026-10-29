import { useListPagination } from "@/hooks/useListPagination";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVpcActions } from "@/hooks/useVpcActions";
import { useState } from "react";
import { listNetworkVpcs, type NetworkVPC, type NetworkResourceStateFilter } from "@/api/network";
import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
  type RowAction,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import CreateVpcModal from "../CreateVpcModal";
import BindVpcEipModal from "../BindVpcEipModal";

type Vpc = NetworkVPC;
type VpcStatusFilter = "" | NetworkResourceStateFilter;

export default function VpcsPage() {
  const qc = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);
  const [bindingVpc, setBindingVpc] = useState<Vpc | null>(null);
  const [status, setStatus] = useState<VpcStatusFilter>("");
  const [searchText, setSearchText] = useState("");
  const paging = useListPagination(JSON.stringify({ status, name: searchText.trim() }), 10);
  const { resetPagination } = paging;
  const vpcs = useQuery({
    meta: {
      errorNotification: { id: "vpcs", action: "VPC 列表加载", fallback: "请求失败，请稍后重试" },
    },
    queryKey: [
      "network-vpcs",
      { page: paging.page, pageSize: paging.pageSize, status, name: searchText.trim() },
    ],
    queryFn: async () => {
      const data = await listNetworkVpcs({
        page: paging.page,
        pageSize: paging.pageSize,
        state: status,
        name: searchText.trim() || undefined,
      });
      return { ...data, total: Number(data.total) };
    },
  });
  const items = vpcs.data?.items ?? [];
  const refresh = () => vpcs.refetch();
  const { actions } = useVpcActions(resetPagination);
  const rowActions: RowAction<Vpc>[] = [
    {
      key: "bind-eip",
      label: "绑定公网 IP",
      disabled: (vpc) => vpc.state === "deleting" || vpc.state === "deleted",
      onClick: setBindingVpc,
    },
    ...actions,
  ];
  const columns: Array<ListColumn<Vpc>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, vpc) => <ResourceNameId name={vpc.name} id={vpc.id} type="vpc" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, vpc) => <StatusBadge status={vpc.state} reason={vpc.reason} />,
    },
    {
      key: "cidr",
      title: "CIDR",
      width: 150,
      ellipsis: true,
      dataIndex: "cidr",
    },
    {
      key: "subnets",
      title: "子网数",
      width: 100,
      ellipsis: true,
      dataIndex: "subnet_count",
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, vpc) => formatDateTime(vpc.created_at),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-VPCwangluo",
          title: "VPC",
          subtitle: "创建和管理相互隔离的虚拟私有云网络",
          actions: [
            {
              key: "create",
              label: "创建 VPC",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: (value) => {
            setStatus(value);
            resetPagination();
          },
          items: [
            { value: "", label: "全部" },
            { value: "RESOURCE_STATE_AVAILABLE", label: "可用" },
            { value: "RESOURCE_STATE_PROVISIONING", label: "创建中" },
            { value: "RESOURCE_STATE_FAILED", label: "异常" },
          ],
        }}
        toolbar={{
          search: {
            fields: [{ value: "name", label: "名称" }],
            field: "name",
            value: searchText,
            onFieldChange: () => {},
            onChange: (value) => {
              setSearchText(value);
              resetPagination();
            },
          },
          refresh: {
            label: "刷新",
            spinning: vpcs.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          loading={vpcs.isFetching}
          rowActions={rowActions}
          tableLabel="VPC 列表"
          pagination={{
            mode: "total",
            page: paging.page,
            pageSize: paging.pageSize,
            total: vpcs.data?.total ?? 0,
            disabled: vpcs.isFetching,
            onPageChange: paging.setPage,
            onPageSizeChange: paging.setPageSize,
          }}
        />
      </ListPageFrame>
      {bindingVpc && (
        <BindVpcEipModal
          vpc={bindingVpc}
          onCancel={() => setBindingVpc(null)}
          onSubmitted={() => setBindingVpc(null)}
        />
      )}
      {createVisible && (
        <CreateVpcModal
          onCancel={() => setCreateVisible(false)}
          onCreated={() => {
            setCreateVisible(false);
            resetPagination();
            qc.invalidateQueries({ queryKey: ["network-vpcs"] });
          }}
        />
      )}
    </>
  );
}
