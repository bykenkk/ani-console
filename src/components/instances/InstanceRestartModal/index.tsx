import { Modal } from "@arco-design/web-react";
import { restartInstance, type InstanceRecord } from "@/api/instances";
import { useInstanceCommandMutation } from "@/hooks/useInstanceCommandMutation";

type InstanceRestartModalProps = {
  instance: InstanceRecord;
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function InstanceRestartModal({
  instance,
  onCancel,
  onSubmitted,
}: InstanceRestartModalProps) {
  const mutation = useInstanceCommandMutation<object>(
    instance.id,
    "restart",
    "重启",
    "notification",
    (input: { expectedVersion: string }) => restartInstance(instance.id, input),
    onSubmitted,
  );
  return (
    <Modal
      visible
      title="重启容器"
      confirmLoading={mutation.isPending}
      onOk={() => mutation.mutateAsync({})}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
    >
      确认重启“{instance.name}”？重启会中断容器进程、终端会话，内存及临时数据可能丢失。工作目录和
      PVC 中已保存的数据保留。
    </Modal>
  );
}
