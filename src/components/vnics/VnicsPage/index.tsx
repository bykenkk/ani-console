import { useState } from "react";
import { Select, Tag } from "@arco-design/web-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listNetworkVnics, type NetworkVnic } from "@/api/network";
import {
  ListPageFrame,
  ListDataTable,
  ResourceId,
  StatusBadge,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useVnicActions } from "@/hooks/useVnicActions";
import { formatDateTime } from "@/lib/format";
import CreateVnicModal from "../CreateVnicModal";
import BindVnicModal from "../BindVnicModal";
import VnicSubnetSelect from "../VnicSubnetSelect";

export default function VnicsPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const [binding, setBinding] = useState<NetworkVnic>();
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
  const { actions } = useVnicActions(paging.resetPagination);
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
          <ResourceId value={item.id} />
        </div>
      ),
    },
    {
      title: "分配状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} reason={item.reason} />,
    },
    {
      title: "使用状态",
      width: 150,
      render: (_, item) =>
        item.bindings?.length ? (
          <Tag>
            {item.bindings.some((binding) => binding.current) ? "使用中" : "已预留，待应用"}
          </Tag>
        ) : (
          <Tag>{item.state === "available" ? "空闲" : "未就绪"}</Tag>
        ),
    },
    {
      title: "VPC / 子网",
      width: 260,
      render: (_, item) => (
        <div className="flex min-w-0 flex-col">
          <Link to="/vpcs/$vpcId" params={{ vpcId: item.vpc_id }} className="truncate">
            {item.vpc_name || item.vpc_id}
          </Link>
          <Link to="/subnets/$subnetId" params={{ subnetId: item.subnet_id }} className="truncate">
            {item.subnet_name || item.subnet_id}
          </Link>
        </div>
      ),
    },
    { title: "MAC", width: 180, render: (_, item) => item.mac_address || "-" },
    {
      title: "IP 地址",
      width: 220,
      render: (_, item) => item.ips?.join(" · ") || item.primary_ip || "-",
    },
    {
      title: "绑定实例",
      width: 250,
      render: (_, item) =>
        item.bindings?.length
          ? item.bindings.map((binding) => (
              <div key={binding.binding_id}>
                <Link
                  to={
                    binding.consumer_kind === "vm"
                      ? "/vms/$instanceId"
                      : binding.compute_type === "gpu"
                        ? "/gpu-containers/$instanceId"
                        : "/containers/$instanceId"
                  }
                  params={{ instanceId: binding.consumer_id }}
                >
                  {binding.consumer_name || binding.consumer_id}
                </Link>
              </div>
            ))
          : "-",
    },
    {
      title: "观察",
      width: 220,
      render: (_, item) => (
        <div>
          {item.observation_stale ? "观察待确认" : item.reason || "-"}
          <div>{formatDateTime(item.observed_at)}</div>
        </div>
      ),
    },
    { title: "创建时间", width: 180, render: (_, item) => formatDateTime(item.created_at) },
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
              <VnicSubnetSelect value={subnetId} onChange={setSubnetId} />
              <Select
                aria-label="分配状态"
                allowClear
                value={state}
                onChange={setState}
                placeholder="全部分配状态"
                style={{ width: 180 }}
                options={[
                  { value: "provisioning", label: "分配中" },
                  { value: "available", label: "可用" },
                  { value: "failed", label: "失败" },
                ]}
              />
              <Select
                aria-label="使用状态"
                allowClear
                value={bindingState}
                onChange={setBindingState}
                placeholder="全部使用状态"
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
          rowActions={[
            {
              key: "bind",
              label: "绑定实例",
              disabled: (item) =>
                item.state !== "available" || !(item.primary_ip || item.ips?.length),
              onClick: setBinding,
            },
            ...actions,
          ]}
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
      {binding && <BindVnicModal vnic={binding} onCancel={() => setBinding(undefined)} />}
    </>
  );
}
