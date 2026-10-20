import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listInstances, type InstanceRecord, type ObservedState } from "@/api/instances";
import {
  ListPageFrame,
  ResourceNameId,
  StatusBadge,
  ListDataTable,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useGpuContainerActions } from "@/hooks/useGpuContainerActions";
import GpuContainerCreateModal from "@/components/gpu-containers/GpuContainerCreateModal";
import { formatDateTime } from "@/lib/format";

type StatusFilter = "all" | Exclude<ObservedState, "deleted">;
export default function GpuContainersPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<"name" | "id">("name");
  const [searchText, setSearchText] = useState("");
  const [createVisible, setCreateVisible] = useState(false);
  const keyword = searchText.trim();
  const observedState = status === "all" ? undefined : status;
  // FIXME(governance-instance-filter): 新列表没有 ID 搜索契约，对应选项保留但禁用，不回退旧列表。
  // TODO(governance-instance-filter): 后端提供 ID 查询后启用选项；状态仅使用新 observedState，不恢复旧扩展状态。
  const canQuery = searchField === "name";
  const paging = useListPagination(JSON.stringify({ status, searchField, keyword }), 10);
  const query = useQuery({
    queryKey: [
      "governance-instances",
      "gpu",
      { page: paging.page, pageSize: paging.pageSize, observedState, keyword },
    ],
    enabled: canQuery,
    meta: {
      errorNotification: {
        id: "gpu_container-instances",
        action: "GPU 容器列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryFn: async ({ signal }) => {
      const data = await listInstances(
        {
          page: paging.page,
          pageSize: paging.pageSize,
          instance_kind: "container",
          compute_type: "gpu",
          observedState,
          name: keyword || undefined,
        },
        signal,
      );
      return { ...data, total: Number(data.total) };
    },
  });
  const { page, setPage } = paging;
  useEffect(() => {
    if (canQuery && query.isSuccess && !query.isFetching && !query.data.items.length && page > 1) {
      setPage(page - 1);
    }
  }, [canQuery, query.isSuccess, query.isFetching, query.data, page, setPage]);
  const { actions, dialogNode } = useGpuContainerActions(paging.resetPagination);
  const columns: ListColumn<InstanceRecord>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 260,
      render: (_, row) => <ResourceNameId name={row.name} id={row.id} type="gpu-instance" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, row) => <StatusBadge status={row.observedState} reason={row.reason} />,
    },
    {
      key: "preset",
      title: "规格",
      width: 180,
      ellipsis: true,
      render: (_, row) => row.preset_name || row.preset_code || row.presetId,
    },
    {
      key: "compute",
      title: "CPU / 内存",
      width: 160,
      render: (_, row) => [row.cpu, row.memory].filter(Boolean).join(" / ") || "-",
    },
    {
      key: "gpu",
      title: "GPU",
      width: 220,
      ellipsis: true,
      render: (_, row) =>
        row.gpu_summary
          ? `${row.gpu_summary.model_key} × ${row.gpu_summary.devices_per_instance}`
          : "-",
    },
    { key: "image", title: "镜像 ID", dataIndex: "imageId", width: 220, ellipsis: true },
    // FIXME(governance-instance-columns): 新列表缺少副本、发布、节点、访问地址和保护字段，原列保留空占位，不补拉旧列表。
    // TODO(governance-instance-columns): 契约补齐后逐列接入，不能用 observedState/Pod IP 等替代旧字段。
    { key: "replicas", title: "副本", width: 80, placeholder: "-" },
    { key: "rollout", title: "发布", width: 120, placeholder: "-" },
    { key: "node", title: "节点", width: 140, placeholder: "-" },
    { key: "endpoint", title: "访问地址", width: 160, placeholder: "-" },
    { key: "protection", title: "终止保护", width: 120, placeholder: "-" },
    {
      key: "created",
      title: "创建时间",
      width: 180,
      render: (_, row) => formatDateTime(row.createdAt),
    },
  ];
  const tabs = [
    { value: "all" as const, label: "全部" },
    { value: "pending" as const, label: "等待中" },
    { value: "running" as const, label: "运行中" },
    { value: "stopped" as const, label: "已停止" },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-GPUrongqishili",
          title: "GPU 容器",
          subtitle: "当前租户权限范围内的资源与操作",
          actions: [
            {
              key: "create",
              label: "创建 GPU 容器",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{ items: tabs, value: status, onChange: setStatus }}
        toolbar={{
          search: {
            fields: [
              { value: "name", label: "名称" },
              { value: "id", label: "ID", disabled: true },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          refresh: {
            label: "刷新",
            spinning: query.isFetching,
            disabled: !canQuery,
            onClick: () => query.refetch(),
          },
        }}
      >
        <ListDataTable
          data={canQuery ? (query.data?.items ?? []) : []}
          columns={columns}
          rowActions={actions}
          loading={canQuery && query.isFetching}
          tableLabel="GPU 容器列表"
          pagination={{
            mode: "total",
            page: paging.page,
            pageSize: paging.pageSize,
            total: canQuery ? (query.data?.total ?? 0) : 0,
            onPageChange: paging.setPage,
            onPageSizeChange: paging.setPageSize,
            disabled: !canQuery || query.isFetching,
          }}
        />
      </ListPageFrame>
      {createVisible && (
        <GpuContainerCreateModal
          onCancel={() => setCreateVisible(false)}
          onCreated={() => {
            setCreateVisible(false);
            paging.resetPagination();
          }}
        />
      )}
      {dialogNode}
    </>
  );
}
