import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteVolume, type StorageVolume } from "@/api/storage/volumes";
import type { RowAction } from "@/components/common";
import ExpandStorageVolumeModal from "@/components/volumes/ExpandStorageVolumeModal";

export function useStorageVolumeActions(onDeleted?: () => void) {
  const queryClient = useQueryClient();
  const [expandTarget, setExpandTarget] = useState<StorageVolume>();
  const remove = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "storage-volume-delete",
        action: "删除块存储卷",
        successText: "删除已提交",
      },
    },
    mutationFn: (volume: StorageVolume) =>
      deleteVolume(volume.pvc_name, { expected_uid: volume.uid }),
    onSuccess: async (_, volume) => {
      // TODO(storage-task): 创建、删除的任务跟踪暂缓；提交后只刷新资源查询。
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storage", "volumes"] }),
        queryClient.invalidateQueries({
          queryKey: ["storage", "volume", volume.pvc_name],
          refetchType: "none",
        }),
      ]);
      onDeleted?.();
    },
  });
  // TODO(storage-migration): 初始化、挂载/卸载和快照保留 useVolumeActions 中的旧实现；新 PVC 不得传给旧 API。
  const unavailable = (key: string, label: string): RowAction<StorageVolume> => ({
    key,
    label,
    disabled: () => true,
    tooltip: "暂未支持",
    onClick: () => {},
  });
  const actions: RowAction<StorageVolume>[] = [
    unavailable("os-init", "初始化引导"),
    {
      key: "expand",
      label: "扩容",
      disabled: (volume) => volume.deleting || remove.isPending,
      onClick: setExpandTarget,
    },
    unavailable("mount", "挂载"),
    unavailable("unmount", "卸载"),
    unavailable("snapshot", "创建快照"),
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: () => remove.isPending,
      loading: (volume) => remove.isPending && remove.variables?.uid === volume.uid,
      onClick: (volume) => {
        Modal.confirm({
          title: "删除块存储卷",
          content: `确定删除「${volume.display_name || volume.pvc_name}」？卷被使用时无法删除。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(volume),
        });
      },
    },
  ];
  return {
    actions,
    dialogNode: expandTarget ? (
      <ExpandStorageVolumeModal volume={expandTarget} onCancel={() => setExpandTarget(undefined)} />
    ) : null,
  };
}
