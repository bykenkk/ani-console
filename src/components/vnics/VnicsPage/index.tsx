import { useState } from "react";
import { Select } from "@arco-design/web-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listNetworkVnics, type NetworkVnic } from "@/api/network";
import {
  ListPageFrame,
  ListDataTable,
  ResourceIdentity,
  StatusBadge,
  SubnetSelect,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useVnicActions } from "@/hooks/useVnicActions";
import CreateVnicModal from "../CreateVnicModal";

export default function VnicsPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState<string>();
  const [bindingState, setBindingState] = useState<string>();
  const [subnetId, setSubnetId] = useState<string>();
  const paging = useListPagination(JSON.stringify({ name, state, bindingState, subnetId }), 20);
  const list = useQuery({
    queryKey: [
      "network-vnics",
      { name, state, bindingState, subnetId, page: paging.page, pageSize: paging.pageSize },
    ],
    queryFn: ({ signal }) =>
      listNetworkVnics(
        {
          name: name.trim() || undefined,
          state,
          binding_state: bindingState,
          subnet_id: subnetId,
          page: paging.page,
          pageSize: paging.pageSize,
        },
        signal,
      ),
    meta: { errorNotification: { id: "vnics", action: "虚拟网卡列表加载" } },
  });
  const { actions, dialogNode } = useVnicActions(paging.resetPagination);
  const columns: ListColumn<NetworkVnic>[] = [
    {
      title: "名称 / ID",
      width: 250,
      fixed: "left",
      render: (_, item) => (
        <div className="flex min-w-0 flex-col">
          <Link to="/vnics/$vnicId" params={{ vnicId: item.id }} className="truncate">
            {item.name}
          </Link>
          <ResourceIdentity display="id" id={item.id} />
        </div>
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} reason={item.reason} />,
    },
    {
      title: "私网 IP",
      width: 220,
      ellipsis: true,
      render: (_, item) => item.ips?.join(" · ") || item.primary_ip || "-",
    },
    {
      title: "关联实例",
      width: 200,
      ellipsis: true,
      // FIXME(api-contract): 后端已确认网卡与实例为一对一关系，bindings 数组为接口设计问题；暂取第一条，待契约修正后调整。
      dataIndex: "bindings[0].consumer_name",
    },
    {
      title: "子网",
      width: 200,
      ellipsis: true,
      render: (_, item) => item.subnet_name || item.subnet_id,
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          title: "虚拟网卡",
          subtitle: "独立申请、保留并复用实例的网络身份与地址",
          iconClassName: "icon-wangluo",
          actions: [
            {
              key: "create",
              label: "申请虚拟网卡",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        toolbar={{
          search: {
            fields: [{ value: "name", label: "名称" }],
            field: "name",
            value: name,
            onFieldChange: () => undefined,
            onChange: setName,
          },
          filters: (
            <div className="flex flex-wrap gap-3">
              <SubnetSelect
                aria-label="子网筛选"
                value={subnetId}
                onChange={setSubnetId}
                allowClear
                placeholder="全部子网"
                style={{ width: 220 }}
              />
              <Select
                aria-label="状态"
                allowClear
                value={state}
                onChange={setState}
                placeholder="全部状态"
                style={{ width: 180 }}
                options={[
                  { value: "provisioning", label: "分配中" },
                  { value: "available", label: "可用" },
                  { value: "failed", label: "失败" },
                ]}
              />
              <Select
                aria-label="绑定状态"
                allowClear
                value={bindingState}
                onChange={setBindingState}
                placeholder="全部绑定状态"
                style={{ width: 180 }}
                options={[
                  { value: "free", label: "未绑定" },
                  { value: "reserved", label: "已预留，待应用" },
                  { value: "bound", label: "已绑定" },
                ]}
              />
            </div>
          ),
          refresh: { label: "刷新", spinning: list.isFetching, onClick: () => list.refetch() },
        }}
      >
        <ListDataTable
          data={list.data?.items ?? []}
          columns={columns}
          rowActions={actions}
          loading={list.isFetching}
          tableLabel="虚拟网卡列表"
          pagination={{
            page: paging.page,
            pageSize: paging.pageSize,
            total: Number(list.data?.total ?? "0"),
            onPageChange: paging.setPage,
            onPageSizeChange: paging.setPageSize,
          }}
        />
      </ListPageFrame>
      {createVisible && (
        <CreateVnicModal
          onCancel={() => setCreateVisible(false)}
          onCreated={paging.resetPagination}
        />
      )}
      {dialogNode}
    </>
  );
}
