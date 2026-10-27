import { applyInstanceLifecycle, listInstances, type InstanceRecord } from "@/api/instances/legacy";
import { withId } from "@/lib/id";
import type { StorageVolume } from "@/api/storage/volumes/legacy";
import { canMountVolumeMode, VOLUME_MODE_LABELS } from "@/lib/volumes";
import { Form, Modal, Select, Typography } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type AttachVolumeModalProps = {
  volume: StorageVolume;
  onCancel: () => void;
  onAttached?: () => void;
};

type Instance = InstanceRecord;

export default function AttachVolumeModal({
  volume,
  onCancel,
  onAttached,
}: AttachVolumeModalProps) {
  const qc = useQueryClient();
  const volumeId = volume.id;
  const [instanceId, setInstanceId] = useState("");
  const instances = useQuery({
    meta: {
      errorNotification: {
        id: withId("instances", "volume-attach"),
        action: "实例列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["instances", "volume-attach"],
    queryFn: () => listInstances({ kind: "vm,container,gpu_container", state: "running,stopped" }),
  });
  const instanceItems = ((instances.data?.items ?? []) as Instance[]).filter((item) =>
    canMountVolumeMode(volume.volume_mode, item.kind),
  );

  useEffect(() => {
    if (!instanceId || instanceItems.some((item) => item.id === instanceId)) return;
    setInstanceId("");
  }, [instanceId, instanceItems]);

  const attach = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "挂载云盘",
        successText: "挂载云盘已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: () => {
      if (!instanceItems.some((item) => item.id === instanceId))
        throw new Error("请选择与卷用途匹配的挂载实例");
      return applyInstanceLifecycle(instanceId, {
        action: "attach_volume",
        volume_id: volumeId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instances"] });
      qc.invalidateQueries({ queryKey: ["volume", volumeId] });
      qc.invalidateQueries({ queryKey: ["volumes"] });
      onAttached?.();
      onCancel();
    },
  });

  return (
    <Modal
      visible
      title="挂载块存储卷"
      onCancel={onCancel}
      onOk={() => attach.mutateAsync()}
      okButtonProps={{ disabled: !instanceId }}
      confirmLoading={attach.isPending}
      unmountOnExit
    >
      <Form layout="vertical">
        <Form.Item
          label="目标实例"
          required
          extra={`卷用途：${VOLUME_MODE_LABELS[volume.volume_mode] ?? "未知"}。仅显示用途匹配的实例；用途不可修改。`}
        >
          <Select
            value={instanceId || undefined}
            onChange={setInstanceId}
            loading={instances.isLoading}
            placeholder="请选择用途匹配且运行中或已停止的实例"
            showSearch
            filterOption={(inputValue, option) =>
              String(option.props.children).toLowerCase().includes(inputValue.toLowerCase())
            }
          >
            {instanceItems.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {item.name} · {item.kind} · {item.state}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Typography.Text type="secondary">
          挂载操作提交后，卷状态和关联实例会自动刷新。
        </Typography.Text>
      </Form>
    </Modal>
  );
}
