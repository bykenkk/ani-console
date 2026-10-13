import { useVolumeActions } from "@/hooks/useVolumeActions";

import { useState } from "react";

import { listVolumes, type StorageVolume } from "@/api/storage/volumes";

import CreateVolumeModal from "@/components/storage/CreateVolumeModal";

import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { formatDateTime } from "@/lib/format";
import { VOLUME_MODE_LABELS } from "@/lib/volumes";

type Volume = StorageVolume;
type StatusFilter = "all" | "pending" | "available" | "mounted" | "failed";
type SearchField = "name" | "id";

export default function VolumesPage() {
  const [createVisible, setCreateVisible] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: volumes,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useClientPaginatedQuery<Volume>({
    errorNotification: {
      id: "volumes",
      action: "块存储卷列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["volumes", { status, searchField, searchText }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listVolumes({
        state: status === "all" || status === "mounted" ? undefined : status,
        in_use: status === "mounted" ? true : undefined,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });
  const { actions, dialogNode } = useVolumeActions(resetPagination);

  const columns: Array<ListColumn<Volume>> = [
    {
      key: "name",
      title: "名称 / ID",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="volume" />,
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} />,
    },
    {
      key: "size",
      title: "容量 (GiB)",
      width: 100,
      dataIndex: "size_gib",
    },
    {
      key: "storageClass",
      title: "类型",
      width: 100,
      dataIndex: "storage_class",
    },
    {
      key: "volumeMode",
      title: "用途",
      width: 120,
      render: (_, item) => VOLUME_MODE_LABELS[item.volume_mode] ?? "-",
    },
    {
      key: "encrypted",
      title: "加密",
      width: 80,
      render: (_, item) => (item.encrypted ? "是" : "否"),
    },
    {
      key: "zone",
      title: "可用区",
      width: 100,
      dataIndex: "zone",
      ellipsis: true,
      placeholder: "-",
    },
    {
      key: "mountInstance",
      title: "挂载实例",
      width: 150,
      ellipsis: true,
      render: (_, item) =>
        item.used_by
          ?.map((instance) => instance.instance_name)
          .filter(Boolean)
          .join("、") || "-",
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
          iconClassName: "icon-kuaicunchu",
          title: "块存储",
          subtitle: "管理可挂载到实例的块存储卷及快照",
          actions: [
            {
              key: "create",
              label: "创建卷",
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
              value: "pending",
              label: "创建中",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "mounted",
              label: "已挂载",
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
            spinning: volumes.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={volumes.isFetching}
          tableLabel="块存储卷列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {createVisible && <CreateVolumeModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}
