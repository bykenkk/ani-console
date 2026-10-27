import { useQuery } from "@tanstack/react-query";
import { listBuckets, type StorageBucketRecord } from "@/api/storage/buckets";
import { ResourceNameId, ListPageFrame, type ListColumn, ListDataTable } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { storageBucketActions } from "@/components/objects/storageBucketActions";

export default function ObjectsPage() {
  const { page, pageSize, setPage, setPageSize } = useListPagination("storage-buckets", 20);
  const buckets = useQuery({
    queryKey: ["storage", "buckets", { page, pageSize }],
    queryFn: ({ signal }) => listBuckets({ page, pageSize }, signal),
    meta: { errorNotification: { id: "storage-buckets", action: "对象存储桶列表加载" } },
  });
  // TODO(storage-migration): 新契约只有逻辑桶 id/name；旧列保留位置，待补齐字段后恢复展示。
  const columns: ListColumn<StorageBucketRecord>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="bucket" />,
    },
    { key: "acl", title: "权限", width: 100, render: () => "-" },
    { key: "storageClass", title: "存储类型", width: 100, render: () => "-" },
    { key: "region", title: "Region", width: 100, render: () => "-" },
    { key: "objectCount", title: "对象数", width: 100, render: () => "-" },
    { key: "sizeBytes", title: "总大小", width: 100, render: () => "-" },
    { key: "createdAt", title: "创建时间", width: 180, render: () => "-" },
  ];
  return (
    <ListPageFrame
      header={{
        iconClassName: "icon-duixiangcunchu1",
        title: "对象存储",
        subtitle: "S3 兼容存储桶，用于保存非结构化对象数据",
        // TODO(storage-migration): 创建桶保留 CreateBucketModal 旧实现，待新接口补齐后恢复入口。
        actions: [
          {
            key: "create",
            label: "创建存储桶",
            iconClassName: "icon-add-1",
            variant: "primary",
            disabled: true,
            tooltip: "暂未支持",
            onClick: () => {},
          },
        ],
      }}
      toolbar={{
        // TODO(storage-filter): 当前桶列表没有搜索参数，不过滤当前页或循环拉取全量桶。
        search: {
          fields: [
            { value: "name", label: "名称" },
            { value: "id", label: "ID" },
          ],
          field: "name",
          value: "",
          disabled: true,
          placeholder: "暂未支持搜索",
          onFieldChange: () => {},
          onChange: () => {},
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
        rowActions={storageBucketActions}
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
  );
}
