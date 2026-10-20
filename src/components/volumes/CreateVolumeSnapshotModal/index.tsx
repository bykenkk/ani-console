import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Modal, Typography } from "@arco-design/web-react";
import { useState } from "react";
import { createVolumeSnapshot } from "@/api/storage/volumes";

type CreateVolumeSnapshotModalProps = {
  volumeId: string;
  onCancel: () => void;
};

export default function CreateVolumeSnapshotModal({
  volumeId,
  onCancel,
}: CreateVolumeSnapshotModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建云盘快照",
        successText: "云盘快照创建已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (_: undefined) => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("请输入快照名称");
      return createVolumeSnapshot(volumeId, { name: trimmedName });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volume-snapshots", volumeId] });
      qc.invalidateQueries({ queryKey: ["volume", volumeId] });
      qc.invalidateQueries({ queryKey: ["volumes"] });
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建快照"
      onCancel={onCancel}
      onOk={() => create.mutateAsync(undefined)}
      confirmLoading={create.isPending}
      unmountOnExit
    >
      <Form layout="vertical">
        <Form.Item label="快照名称" required>
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入快照名称"
            maxLength={64}
            showWordLimit
          />
        </Form.Item>
        <Typography.Text type="secondary">快照用于在任意时间点恢复块存储卷数据。</Typography.Text>
      </Form>
    </Modal>
  );
}
