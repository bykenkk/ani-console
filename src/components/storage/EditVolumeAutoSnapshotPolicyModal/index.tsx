import {
  updateVolumeAutoSnapshotPolicy,
  type StorageVolumeAutoSnapshotPolicy,
  type StorageVolumeAutoSnapshotPolicyUpdateInput,
} from "@/api/storage/volumes";
import { validateForm } from "@/lib/form";
import { Form, Input, InputNumber, Modal, Switch } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function EditVolumeAutoSnapshotPolicyModal({
  volumeId,
  policy,
  onCancel,
}: {
  volumeId: string;
  policy: StorageVolumeAutoSnapshotPolicy;
  onCancel: () => void;
}) {
  const [form] = Form.useForm<StorageVolumeAutoSnapshotPolicyUpdateInput>();
  const queryClient = useQueryClient();
  const updatePolicy = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "保存自动快照策略",
        successText: "自动快照策略已保存",
        errorFallback: "自动快照策略保存失败",
      },
    },
    mutationFn: (values: StorageVolumeAutoSnapshotPolicyUpdateInput) =>
      updateVolumeAutoSnapshotPolicy(volumeId, values),
    onSuccess: () => {
      onCancel();
      queryClient.invalidateQueries({ queryKey: ["volume", volumeId] });
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
  });

  return (
    <Modal
      title="编辑自动快照策略"
      visible
      unmountOnExit
      confirmLoading={updatePolicy.isPending}
      okText="确认保存"
      onOk={() =>
        validateForm<StorageVolumeAutoSnapshotPolicyUpdateInput>(form).then((values) =>
          updatePolicy.mutateAsync(values),
        )
      }
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical" initialValues={policy}>
        <Form.Item label="启用自动快照" field="enabled" triggerPropName="checked">
          <Switch checkedText="开启" uncheckedText="关闭" />
        </Form.Item>
        <Form.Item
          label="保留天数"
          field="retain_days"
          rules={[{ required: true, type: "number", min: 1, max: 365 }]}
        >
          <InputNumber min={1} max={365} suffix="天" className="w-full" />
        </Form.Item>
        <Form.Item
          label="执行计划"
          field="schedule"
          rules={[{ required: true, message: "请输入执行计划" }]}
          extra="使用支持的计划格式，例如 daily@02:00。"
        >
          <Input placeholder="daily@02:00" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
