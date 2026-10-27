import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listVolumes, type StorageVolume } from "@/api/storage/volumes";
import { useListPagination } from "@/hooks/useListPagination";
import { useStorageVolumeActions } from "@/hooks/useStorageVolumeActions";
import CreateStorageVolumeModal from "@/components/volumes/CreateStorageVolumeModal";
import {
  ResourceNameId,
  ListPageFrame,
  ListDataTable,
  StatusBadge,
  type ListColumn,
} from "@/components/common";

export default function VolumesPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination(
    "storage-volumes",
    20,
  );
  const volumes = useQuery({
    queryKey: ["storage", "volumes", { page, pageSize }],
    queryFn: ({ signal }) => listVolumes({ page, pageSize }, signal),
    meta: { errorNotification: { id: "storage-volumes", action: "块存储卷列表加载" } },
  });
  const { actions, dialogNode } = useStorageVolumeActions(resetPagination);
  // TODO(storage-migration): 新契约暂无加密、可用区、使用方和创建时间，保留列位置但不补造值；旧类型与查询仍在 legacy。
  const columns: ListColumn<StorageVolume>[] = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => (
        <ResourceNameId name={item.display_name} id={item.pvc_name} type="volume" />
      ),
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.deleting ? "deleting" : item.phase} />,
    },
    { key: "size", title: "容量 (GB)", width: 100, dataIndex: "requested_capacity_gb" },
    {
      key: "storageClass",
      title: "类型",
      width: 100,
      dataIndex: "storage_class_name",
      ellipsis: true,
    },
    {
      key: "volumeMode",
      title: "用途",
      width: 120,
      render: (_, item) => (item.volume_mode === "Block" ? "块设备" : "文件系统"),
    },
    { key: "encrypted", title: "加密", width: 80, render: () => "-" },
    { key: "zone", title: "可用区", width: 100, render: () => "-" },
    { key: "mountInstance", title: "挂载实例", width: 150, render: () => "-" },
    { key: "createdAt", title: "创建时间", width: 180, render: () => "-" },
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
        // TODO(storage-filter): 当前只接入全部卷；后端补齐状态、挂载与搜索后恢复筛选，不对当前页本地过滤。
        tabs={{
          value: "all",
          onChange: () => {},
          items: [
            { value: "all", label: "全部" },
            { value: "pending", label: "创建中", disabled: true },
            { value: "available", label: "可用", disabled: true },
            { value: "mounted", label: "已挂载", disabled: true },
            { value: "failed", label: "异常", disabled: true },
          ],
        }}
        toolbar={{
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
            spinning: volumes.isFetching,
            onClick: () => {
              volumes.refetch();
            },
          },
        }}
      >
        <ListDataTable
          data={volumes.data?.items ?? []}
          columns={columns}
          rowKey="pvc_name"
          rowActions={actions}
          loading={volumes.isFetching}
          tableLabel="块存储卷列表"
          pagination={{
            page,
            pageSize,
            total: Number(volumes.data?.total ?? "0"),
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      {createVisible && <CreateStorageVolumeModal onCancel={() => setCreateVisible(false)} />}
      {dialogNode}
    </>
  );
}
