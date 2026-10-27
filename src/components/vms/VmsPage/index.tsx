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
import { useVmListActions } from "@/hooks/useVmListActions";
import VmCreateModal from "../VmCreateModal";

export default function VmsPage() {
  const [creating, setCreating] = useState(false);
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination("vms", 20);
  const query = useQuery({
    queryKey: ["vms", "list", { page, pageSize }],
    queryFn: ({ signal }) => listVms({ page, pageSize }, signal),
    meta: { errorNotification: { id: "vms", action: "云主机列表加载" } },
  });
  const { actions } = useVmListActions();
  const columns: ListColumn<VirtualMachine>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      // TODO(vm-detail): 详情仍使用旧 ANI 契约，待统一组件时迁移。
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
    { key: "desired", title: "期望状态", width: 120, dataIndex: "desiredState" },
    {
      key: "cpu",
      title: "CPU / 内存",
      width: 170,
      render: (_, vm) => `${Number(vm.cpuMillis) / 1000} CPU / ${vm.memoryMib} MiB`,
    },
    {
      key: "os",
      title: "操作系统",
      width: 150,
      render: (_, vm) => `${vm.osFamily} ${vm.osVersion}`,
    },
    {
      key: "ip",
      title: "IP 地址",
      width: 180,
      render: (_, vm) => vm.addresses?.map((item) => item.address).join(" · ") || "-",
    },
    { key: "reason", title: "原因", width: 220, dataIndex: "reason", ellipsis: true },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-yunzhuji",
          title: "云主机 VM",
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
        toolbar={{
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
          tableLabel="云主机 VM 列表"
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
    </>
  );
}
