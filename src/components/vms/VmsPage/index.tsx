import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listVms, type VirtualMachine } from "@/api/vms";
import {
  ResourceNameId,
  ListPageFrame,
  ListDataTable,
  StatusBadge,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useVMActions } from "@/hooks/useVMActions";
import VmCreateModal from "../VmCreateModal";

export default function VmsPage() {
  const [creating, setCreating] = useState(false);
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination("vms", 20);
  const query = useQuery({
    queryKey: ["vms", "list", { page, pageSize }],
    queryFn: ({ signal }) => listVms({ page, pageSize }, signal),
    meta: { errorNotification: { id: "vms", action: "云主机列表加载" } },
  });
  const { actions, dialogNode } = useVMActions(query.data?.items ?? []);
  // TODO(vm-filter): 新列表仅支持分页；状态与名称 / ID 搜索保留禁用，待正式筛选契约补齐。
  const statusTabs = [
    { value: "all", label: "全部" },
    { value: "pending", label: "等待中", disabled: true },
    { value: "provisioning", label: "配置中", disabled: true },
    { value: "starting", label: "启动中", disabled: true },
    { value: "running", label: "运行中", disabled: true },
    { value: "stopping", label: "停止中", disabled: true },
    { value: "stopped", label: "已停止", disabled: true },
    { value: "failed", label: "异常", disabled: true },
  ];
  const columns: ListColumn<VirtualMachine>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, vm) => <ResourceNameId type="vm-instance" name={vm.name} id={vm.id} />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, vm) => (
        <StatusBadge status={vm.observedState} reason={vm.reason} loading={false} />
      ),
    },
    {
      key: "compute",
      title: "CPU / 内存",
      width: 180,
      ellipsis: true,
      render: (_, vm) =>
        [
          vm.cpuMillis ? `${Number(vm.cpuMillis) / 1000}C` : "-",
          vm.memoryMib ? `${Number(vm.memoryMib) / 1024} GiB` : "-",
        ].join(" / "),
    },
    {
      key: "systemDiskSizeGb",
      title: "系统盘",
      width: 140,
      render: (_, vm) => (vm.systemDiskSizeGb ? `${vm.systemDiskSizeGb} GB` : "-"),
    },
    { key: "image", title: "镜像", width: 180, dataIndex: "mediaKey", ellipsis: true },
    {
      key: "ip",
      title: "IP 地址",
      width: 180,
      ellipsis: true,
      render: (_, vm) =>
        vm.addresses
          ?.map((item) => item.address)
          .filter(Boolean)
          .join(" · ") || "-",
    },
    // TODO(vm-list-fields): 新契约缺少节点、终止保护和创建时间，保留原列默认占位。
    { key: "node", title: "节点", width: 150 },
    { key: "protection", title: "终止保护", width: 120 },
    { key: "createdAt", title: "创建时间", width: 180 },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-yunzhuji",
          title: "云主机",
          subtitle: "创建虚拟机，管理开关机、重启和 VNC 控制台",
          actions: [
            {
              key: "create",
              label: "创建云主机",
              variant: "primary",
              iconClassName: "icon-add-1",
              onClick: () => setCreating(true),
            },
          ],
        }}
        tabs={{ items: statusTabs, value: "all", onChange: () => undefined }}
        toolbar={{
          search: {
            disabled: true,
            fields: [{ value: "keyword", label: "名称 / ID" }],
            field: "keyword",
            value: "",
            placeholder: "搜索云主机名称或 ID",
            onFieldChange: () => undefined,
            onChange: () => undefined,
          },
          refresh: {
            label: "刷新",
            spinning: query.isFetching,
            onClick: () => {
              query.refetch();
            },
          },
        }}
      >
        <ListDataTable
          data={query.data?.items ?? []}
          columns={columns}
          rowActions={actions}
          loading={query.isLoading}
          tableLabel="云主机列表"
          pagination={{
            page,
            pageSize,
            total: Number(query.data?.total ?? "0"),
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      {creating && (
        <VmCreateModal
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            resetPagination();
          }}
        />
      )}
      {dialogNode}
    </>
  );
}
