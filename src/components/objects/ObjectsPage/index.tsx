import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listBuckets,
  type StorageBucketRecord,
  type StorageBucketStats,
} from "@/api/storage/buckets";
import { ResourceNameId, ListPageFrame, type ListColumn, ListDataTable } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useStorageBucketActions } from "@/hooks/useStorageBucketActions";
import CreateBucketModal from "@/components/objects/CreateBucketModal";
import { formatBytes, formatDateTime } from "@/lib/format";

export default function ObjectsPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const { actions, dialogNode } = useStorageBucketActions();
  const queryClient = useQueryClient();
  const cachedStats = (id: string) =>
    queryClient.getQueryData<StorageBucketStats>(["storage", "bucket-stats", id]);
  const [searchField, setSearchField] = useState<"name" | "id">("name");
  const [searchText, setSearchText] = useState("");
  const filters = {
    name: searchField === "name" ? searchText.trim() || undefined : undefined,
    id: searchField === "id" ? searchText.trim() || undefined : undefined,
  };
  const { page, pageSize, setPage, setPageSize } = useListPagination(
    JSON.stringify(["storage-buckets", filters]),
    20,
  );
  const buckets = useQuery({
    queryKey: ["storage", "buckets", { page, pageSize, ...filters }],
    queryFn: ({ signal }) => listBuckets({ page, pageSize, ...filters }, signal),
    meta: { errorNotification: { id: "storage-buckets", action: "对象存储桶列表加载" } },
  });
  // 统计只展示详情页已请求的缓存，不在列表中逐桶扫描。
  const columns: ListColumn<StorageBucketRecord>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="bucket" />,
    },
    { key: "acl", dataIndex: "acl", title: "权限", width: 100 },
    { key: "storageClass", dataIndex: "storage_class", title: "存储类型", width: 100 },
    { key: "region", dataIndex: "region", title: "Region", width: 100 },
    {
      key: "objectCount",
      title: "对象数",
      width: 100,
      render: (_, item) => {
        const stats = cachedStats(item.id);
        return stats ? `${stats.truncated ? "≥" : ""}${stats.object_count}` : "-";
      },
    },
    {
      key: "sizeBytes",
      title: "总大小",
      width: 100,
      render: (_, item) => {
        const stats = cachedStats(item.id);
        return stats
          ? `${stats.truncated ? "≥" : ""}${formatBytes(Number(stats.total_size))}`
          : "-";
      },
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, item) => (item.created_at ? formatDateTime(item.created_at) : "-"),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-duixiangcunchu1",
          title: "对象存储",
          subtitle: "S3 兼容存储桶，用于保存非结构化对象数据",
          actions: [
            {
              key: "create",
              label: "创建存储桶",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        toolbar={{
          search: {
            fields: [
              { value: "name", label: "名称" },
              { value: "id", label: "ID" },
            ],
            field: searchField,
            value: searchText,
            placeholder: searchField === "name" ? "请输入名称关键字" : "请输入桶 ID",
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          refresh: {
            label: "刷新",
            spinning: buckets.isFetching,
            onClick: () => {
              buckets.refetch();
            },
          },
        }}
      >
        <ListDataTable
          data={buckets.data?.items ?? []}
          columns={columns}
          rowActions={actions}
          loading={buckets.isFetching}
          tableLabel="对象存储桶列表"
          pagination={{
            page,
            pageSize,
            total: Number(buckets.data?.total ?? "0"),
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      {createVisible ? (
        <CreateBucketModal onCancel={() => setCreateVisible(false)} onCreated={() => setPage(1)} />
      ) : null}
      {dialogNode}
    </>
  );
}
