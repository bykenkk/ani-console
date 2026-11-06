import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restartInstance, type InstanceRecord } from "@/api/instances";
import { withId } from "@/lib/id";

type ContainerRestartModalProps = {
  instance: InstanceRecord;
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function ContainerRestartModal({
  instance,
  onCancel,
  onSubmitted,
}: ContainerRestartModalProps) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["instance-command", instance.id, "restart"],
    retry: false,
    mutationFn: () => restartInstance(instance.id, { expectedVersion: instance.version }),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("instance-command", "restart", instance.id),
        action: "重启",
        successText: "重启已提交",
        errorFallback: "重启失败，请稍后重试",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["instances", instance.compute_type] }),
        qc.invalidateQueries({ queryKey: ["instance", instance.id] }),
        qc.invalidateQueries({ queryKey: ["container-network-interfaces", instance.id] }),
        qc.invalidateQueries({ queryKey: ["network-vnics"] }),
        qc.invalidateQueries({ queryKey: ["network-vnic"] }),
      ]);
      onSubmitted();
    },
  });
  return (
    <Modal
      visible
      title="重启容器"
      confirmLoading={mutation.isPending}
      onOk={() => mutation.mutateAsync()}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
    >
      确认重启“{instance.name}”？重启会中断容器进程、终端会话，内存及临时数据可能丢失。工作目录和
      PVC 中已保存的数据保留。 待生效的主网卡配置将在本次重启应用。
    </Modal>
  );
}
