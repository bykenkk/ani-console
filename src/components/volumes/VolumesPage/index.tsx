import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listVolumes, type StorageVolume, type StorageVolumePhase } from "@/api/storage/volumes";
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
  const [state, setState] = useState<"" | StorageVolumePhase>("");
  const [searchField, setSearchField] = useState<"name" | "id">("name");
  const [searchText, setSearchText] = useState("");
  const filters = {
    name: searchField === "name" ? searchText.trim() || undefined : undefined,
    id: searchField === "id" ? searchText.trim() || undefined : undefined,
    state: state || undefined,
  };
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination(
    JSON.stringify(["storage-volumes", filters]),
    20,
  );
  const volumes = useQuery({
    queryKey: ["storage", "volumes", { page, pageSize, ...filters }],
    queryFn: ({ signal }) => listVolumes({ page, pageSize, ...filters }, signal),
    meta: { errorNotification: { id: "storage-volumes", action: "块存储卷列表加载" } },
  });
  const { actions, dialogNode } = useStorageVolumeActions(resetPagination);
  // TODO(storage-migration): 新契约暂无可用区、使用方和创建时间，保留列位置但不补造值；旧类型与查询仍在 legacy。
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
      render: (_, item) => <StatusBadge status={item.phase} />,
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
        tabs={{
          value: state,
          onChange: setState,
          items: [
            { value: "", label: "全部" },
            { value: "Pending", label: "Pending" },
            { value: "Bound", label: "Bound" },
            { value: "Lost", label: "Lost" },
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
            placeholder: searchField === "name" ? "请输入名称关键字" : "请输入 PVC 名称或 UID",
            onFieldChange: setSearchField,
            onChange: setSearchText,
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
          loading={volumes.isLoading}
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
