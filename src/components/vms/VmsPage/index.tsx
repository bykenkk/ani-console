import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listVms, type VirtualMachine, type VmStateFilter } from "@/api/vms";
import {
  ResourceNameId,
  ListPageFrame,
  ListDataTable,
  StatusBadge,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useVMActions } from "@/hooks/useVMActions";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import VmCreateModal from "../VmCreateModal";

export default function VmsPage() {
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<VmStateFilter>("all");
  const [searchText, setSearchText] = useState("");
  const state = status === "all" ? undefined : status;
  const keyword = searchText.trim() || undefined;
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination(
    withId("vms", status, keyword),
    20,
  );
  const query = useQuery({
    queryKey: ["vms", "list", { page, pageSize, state, keyword }],
    queryFn: ({ signal }) => listVms({ page, pageSize, state, keyword }, signal),
    meta: { errorNotification: { id: "vms", action: "云主机列表加载" } },
  });
  const { actions, dialogNode } = useVMActions(query.data?.items ?? []);
  const statusTabs: Array<{ value: VmStateFilter; label: string }> = [
    { value: "all", label: "全部" },
    { value: "pending", label: "等待中" },
    { value: "provisioning", label: "配置中" },
    { value: "starting", label: "启动中" },
    { value: "running", label: "运行中" },
    { value: "stopping", label: "停止中" },
    { value: "stopped", label: "已停止" },
    { value: "failed", label: "异常" },
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
    // TODO(vm-list-fields): 新契约缺少节点和终止保护，保留原列默认占位。
    { key: "node", title: "节点", width: 150 },
    { key: "protection", title: "终止保护", width: 120 },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, vm) => formatDateTime(vm.createdAt),
    },
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
        tabs={{ items: statusTabs, value: status, onChange: setStatus }}
        toolbar={{
          search: {
            fields: [{ value: "keyword", label: "名称 / ID" }],
            field: "keyword",
            value: searchText,
            placeholder: "搜索云主机名称或 ID",
            onFieldChange: () => undefined,
            onChange: setSearchText,
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
