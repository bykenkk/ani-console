import { useBucketActions } from "@/hooks/useBucketActions";
import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { listBuckets, type StorageBucketRecord } from "@/api/storage/buckets";

import CreateBucketModal from "@/components/objects/CreateBucketModal";
import { ResourceNameId, ListPageFrame, type ListColumn, ListDataTable } from "@/components/common";
import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { formatBytes, formatDateTime } from "@/lib/format";

type Bucket = StorageBucketRecord;
type SearchField = "name" | "id";

export default function ObjectsPage() {
  const queryClient = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);

  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: buckets,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useClientPaginatedQuery<Bucket>({
    errorNotification: {
      id: "buckets",
      action: "对象存储桶列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["buckets", { searchField, searchText }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listBuckets({
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions, dialogNode } = useBucketActions(() => {
    resetPagination();
    queryClient.invalidateQueries({ queryKey: ["buckets"] });
  });

  const columns: Array<ListColumn<Bucket>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="bucket" />,
    },
    {
      key: "acl",
      title: "权限",
      width: 100,
      render: (_, item) => (item.acl === "tenant_read" ? "租户内读" : "私有"),
    },
    {
      key: "storageClass",
      title: "存储类型",
      width: 100,
      render: (_, item) => (item.storage_class === "infrequent_access" ? "低频" : "标准"),
    },
    {
      key: "region",
      title: "Region",
      dataIndex: "region",
      width: 100,
      ellipsis: true,
    },
    {
      key: "objectCount",
      title: "对象数",
      dataIndex: "object_count",
      width: 100,
      ellipsis: true,
    },
    {
      key: "sizeBytes",
      title: "总大小",
      width: 100,
      ellipsis: true,
      render: (_, item) => formatBytes(item.size_bytes),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, item) => formatDateTime(item.created_at),
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
              {
                value: "name",
                label: "名称",
              },
              {
                value: "id",
                label: "ID",
              },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          refresh: {
            label: "刷新",
            spinning: buckets.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={buckets.isFetching}
          tableLabel="对象存储桶列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {createVisible && <CreateBucketModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}
