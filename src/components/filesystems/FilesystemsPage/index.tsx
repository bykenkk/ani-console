import { useFilesystemActions } from "@/hooks/useFilesystemActions";

import { useState } from "react";
import { listFilesystems, type StorageFilesystem } from "@/api/storage/filesystems";

import CreateFilesystemModal from "@/components/filesystems/CreateFilesystemModal";

import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { formatDateTime } from "@/lib/format";

type Filesystem = StorageFilesystem;
type StatusFilter = "all" | "available" | "pending" | "failed";
type SearchField = "name" | "id";

export default function FilesystemsPage() {
  const [createVisible, setCreateVisible] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: filesystems,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useClientPaginatedQuery<Filesystem>({
    errorNotification: {
      id: "filesystems",
      action: "文件存储列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["filesystems", { status, searchField, searchText }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listFilesystems({
        state: status === "all" ? undefined : status,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions, dialogNode } = useFilesystemActions(resetPagination);

  const columns: Array<ListColumn<Filesystem>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="filesystem" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} />,
    },
    {
      key: "size",
      title: "容量",
      width: 100,
      ellipsis: true,
      render: (_, item) => `${item.size_gib} GiB`,
    },
    {
      key: "protocol",
      title: "协议",
      width: 100,
      render: (_, item) => item.protocol.toUpperCase(),
    },
    {
      key: "performanceMode",
      title: "性能模式",
      width: 100,
      render: (_, item) =>
        item.performance_mode === "standard"
          ? "标准型"
          : item.performance_mode === "throughput"
            ? "吞吐型"
            : "-",
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 150,
      render: (_, item) => formatDateTime(item.created_at),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-wenjiancunchu",
          title: "文件存储",
          subtitle: "管理共享文件系统、挂载目标与访问方式",
          actions: [
            {
              key: "create",
              label: "创建文件存储",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: setStatus,
          items: [
            {
              value: "all",
              label: "全部",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "pending",
              label: "创建中",
            },
            {
              value: "failed",
              label: "异常",
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
            spinning: filesystems.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={filesystems.isFetching}
          tableLabel="文件存储列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {createVisible && <CreateFilesystemModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}
