import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSandboxes, type Sandbox } from "@/api/sandboxes";
import {
  ResourceNameId,
  ListPageFrame,
  StatusBadge,
  type ListColumn,
  ListDataTable,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useSandboxActions } from "@/hooks/useSandboxActions";
import { formatDateTime } from "@/lib/format";
import SandboxCreateModal from "@/components/sandboxes/SandboxCreateModal";

export default function SandboxesPage() {
  const [creating, setCreating] = useState(false);
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination(
    "sandboxes",
    20,
  );
  const query = useQuery({
    queryKey: ["sandboxes", "list", { page, pageSize }],
    queryFn: ({ signal }) => listSandboxes({ page, pageSize }, signal),
    meta: { errorNotification: { id: "sandboxes", action: "沙箱列表加载" } },
  });
  const { actions } = useSandboxActions();
  // TODO(sandbox-filter): 保留筛选入口但禁用，后端提供正式筛选参数后再接入。
  const statusTabs = [
    { value: "all", label: "全部" },
    { value: "provisioning", label: "配置中", disabled: true },
    { value: "running", label: "运行中", disabled: true },
    { value: "paused", label: "已暂停", disabled: true },
    { value: "unknown", label: "状态未知", disabled: true },
  ];
  const columns: ListColumn<Sandbox>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, sandbox) => (
        <ResourceNameId
          name={sandbox.snapshot?.name || sandbox.id}
          id={sandbox.id}
          type="sandbox-instance"
        />
      ),
    },
    {
      key: "observed_state",
      title: "当前状态",
      width: 120,
      render: (_, sandbox) => (
        <StatusBadge status={sandbox.observed_state} reason={sandbox.reason} loading={false} />
      ),
    },
    { key: "desired_state", title: "期望状态", width: 120, dataIndex: "desired_state" },
    {
      key: "compute",
      title: "CPU / 内存",
      width: 180,
      ellipsis: true,
      render: (_, sandbox) =>
        [
          sandbox.snapshot?.cpu_millis ? `${Number(sandbox.snapshot.cpu_millis) / 1000}C` : "-",
          sandbox.snapshot?.memory_mib ? `${Number(sandbox.snapshot.memory_mib) / 1024} GiB` : "-",
        ].join(" / "),
    },
    {
      key: "image",
      title: "镜像引用",
      width: 260,
      dataIndex: "snapshot.image_reference",
      ellipsis: true,
    },
    { key: "workspace", title: "工作区容量", width: 140, dataIndex: "snapshot.workspace.size" },
    {
      key: "runtime",
      title: "RuntimeClass",
      width: 180,
      dataIndex: "snapshot.runtime_class",
      ellipsis: true,
    },
    { key: "reason", title: "状态原因", width: 240, dataIndex: "reason", ellipsis: true },
    {
      key: "observed_at",
      title: "状态观测时间",
      width: 180,
      render: (_, sandbox) => formatDateTime(sandbox.observed_at),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-Sandbox",
          title: "沙箱",
          subtitle: "管理隔离运行环境和持久化工作区",
          actions: [
            {
              key: "create",
              label: "创建沙箱",
              iconClassName: "icon-add-1",
              variant: "primary",
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
            placeholder: "搜索沙箱名称或 ID",
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
          tableLabel="沙箱列表"
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
        <SandboxCreateModal
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
