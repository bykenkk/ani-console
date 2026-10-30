import VolumeOSInitGuideModal from "@/components/volumes/VolumeOSInitGuideModal";
import { applyInstanceLifecycle } from "@/api/instances/legacy";
import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useResourceDelete } from "@/hooks/useResourceDelete";
import { useState } from "react";
import { type StorageVolume } from "@/api/storage/volumes/legacy";
import CreateVolumeSnapshotModal from "@/components/volumes/CreateVolumeSnapshotModal";
import ExpandVolumeModal from "@/components/volumes/ExpandVolumeModal";
import AttachVolumeModal from "@/components/volumes/AttachVolumeModal";
import type { RowAction } from "@/components/common";
type Volume = StorageVolume;
export function useVolumeActions(onDeleted?: (item: Volume) => void) {
  const queryClient = useQueryClient();
  const [attachTarget, setAttachTarget] = useState<Volume | null>(null);
  const [expandTarget, setExpandTarget] = useState<Volume | null>(null);
  const [snapshotTarget, setSnapshotTarget] = useState<{ id: string } | null>(null);
  const [initGuideId, setInitGuideId] = useState<string>();
  const deleteVolume = useResourceDelete<Volume>("volume", onDeleted);
  const detachVolume = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "volume-detach",
        action: "卸载云盘",
        successText: "卸载云盘已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (volume: Volume) =>
      applyInstanceLifecycle(volume.mount_instance_id!, {
        action: "detach_volume",
        volume_id: volume.id,
      }),
    onSuccess: async (_, volume) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["volume", volume.id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["volumes"] }),
      ]);
    },
  });
  const isMounted = (item: Volume) => Boolean(item.mount_instance_id);
  const actions: RowAction<Volume>[] = [
    { key: "os-init", label: "初始化引导", onClick: (item) => setInitGuideId(item.id) },
    {
      key: "expand",
      label: "扩容",
      onClick: setExpandTarget,
    },
    {
      key: "mount",
      label: "挂载",
      visible: (item) => !isMounted(item),
      onClick: setAttachTarget,
    },
    {
      key: "unmount",
      label: "卸载",
      intent: "danger",
      visible: isMounted,
      loading: (item) => detachVolume.isPending && detachVolume.variables?.id === item.id,
      onClick: (item) => {
        if (detachVolume.isPending) return;
        Modal.confirm({
          title: "卸载块存储卷",
          content: `确定从「${item.mount_name || item.mount_instance_id}」卸载「${item.name}」？请先确保实例内没有进程正在读写该卷。`,
          okButtonProps: { status: "danger" },
          onOk: () => detachVolume.mutateAsync(item),
        });
      },
    },
    {
      key: "snapshot",
      label: "创建快照",
      onClick: setSnapshotTarget,
    },
    {
      key: "delete",
      label: "删除",
      disabled: deleteVolume.isDisabled,
      loading: (item) => deleteVolume.isPending && deleteVolume.variables?.id === item.id,
      intent: "danger",
      onClick: (item) => deleteVolume.confirm(item),
    },
  ];
  const dialogNode = (
    <>
      {initGuideId && (
        <VolumeOSInitGuideModal volumeId={initGuideId} onCancel={() => setInitGuideId(undefined)} />
      )}
      {attachTarget && (
        <AttachVolumeModal volume={attachTarget} onCancel={() => setAttachTarget(null)} />
      )}
      {expandTarget && (
        <ExpandVolumeModal volume={expandTarget} onCancel={() => setExpandTarget(null)} />
      )}
      {snapshotTarget && (
        <CreateVolumeSnapshotModal
          volumeId={snapshotTarget.id}
          onCancel={() => setSnapshotTarget(null)}
        />
      )}
    </>
  );
  return {
    actions,
    dialogNode,
    openAttach: setAttachTarget,
    openSnapshot: (volumeId: string) => setSnapshotTarget({ id: volumeId }),
  };
}
