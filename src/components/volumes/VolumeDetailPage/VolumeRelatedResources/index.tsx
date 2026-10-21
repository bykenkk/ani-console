import { useVolumeDetach } from "@/hooks/useVolumeDetach";

import type { StorageVolume } from "@/api/storage/volumes";
import { DataTable, ResourceNameId, StatusBadge, type RowAction } from "@/components/common";

import { Button } from "@arco-design/web-react";

type VolumeRelatedResourcesProps = {
  volume: StorageVolume;
  onAttach: () => void;
};

type MountedInstance = NonNullable<StorageVolume["used_by"]>[number];

export default function VolumeRelatedResources({ volume, onAttach }: VolumeRelatedResourcesProps) {
  const detachVolume = useVolumeDetach();
  const actions: RowAction<MountedInstance>[] = [
    {
      key: "detach",
      label: "卸载",
      intent: "danger",
      loading: () => detachVolume.isPending,
      onClick: (item) => {
        detachVolume.confirm({
          volumeId: volume.id,
          volumeName: volume.name,
          instanceId: item.instance_id,
          instanceName: item.instance_name,
        });
      },
    },
  ];

  const items = volume.used_by ?? [];

  return (
    <>
      <div>
        <DataTable<MountedInstance>
          header={{
            title: "关联实例",
            extra: items.length === 0 ? <Button onClick={onAttach}>挂载</Button> : undefined,
          }}
          columns={[
            {
              title: "实例名称 / ID",
              width: 200,
              render: (_, item) => (
                <ResourceNameId name={item.instance_name} id={item.instance_id} openable={false} />
              ),
            },
            { title: "实例类型", width: 140, dataIndex: "kind" },
            { title: "状态", width: 120, render: (_, item) => <StatusBadge status={item.state} /> },
          ]}
          data={items}
          pagination={false}
          rowActions={actions}
        />
      </div>
    </>
  );
}
