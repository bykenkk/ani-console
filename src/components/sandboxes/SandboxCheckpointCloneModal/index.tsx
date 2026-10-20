// TODO(submit-result): 沙箱克隆尚未迁移 governance，暂保留原结果提示和详情入口；迁移后确认返回值用途并清理创建后导航。
import { cloneSandboxCheckpoint, type SandboxCheckpoint } from "@/api/instances/legacy";
import { Form, Input, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { navigateToResourceDetail } from "@/lib/resources";

type SandboxCheckpointCloneModalProps = {
  instanceId: string;
  checkpoint: SandboxCheckpoint;
  onCancel: () => void;
};

export default function SandboxCheckpointCloneModal({
  instanceId,
  checkpoint,
  onCancel,
}: SandboxCheckpointCloneModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(`${checkpoint.name}-clone`);
  const cloneCheckpoint = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "sandbox-checkpoint-clone",
        action: "检查点克隆",
        errorFallback: "检查点克隆失败",
      },
    },
    mutationFn: () => cloneSandboxCheckpoint(instanceId, checkpoint.id, { name: name.trim() }),
    onSuccess: (data) => {
      onCancel();
      Modal.success({
        title: "沙箱克隆已创建",
        content: `${data.instance.name} 已从检查点创建。`,
        okText: "查看新实例",
        onOk: () =>
          navigateToResourceDetail(navigate, {
            type: "sandbox-instance",
            id: data.instance.id,
          }),
      });
    },
  });

  return (
    <Modal
      visible
      title={`从检查点克隆 · ${checkpoint.name}`}
      confirmLoading={cloneCheckpoint.isPending}
      okButtonProps={{ disabled: !name.trim() }}
      onCancel={onCancel}
      onOk={() => cloneCheckpoint.mutate()}
    >
      <Form layout="vertical">
        <Form.Item label="新沙箱名称" required>
          <Input value={name} onChange={setName} maxLength={128} showWordLimit />
        </Form.Item>
      </Form>
    </Modal>
  );
}
