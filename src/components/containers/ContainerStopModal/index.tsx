import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getInstance, stopInstance } from "@/api/instances";
import { withId } from "@/lib/id";

type ContainerStopModalProps = {
  instance: { id: string; name: string; version?: string };
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function ContainerStopModal({
  instance,
  onCancel,
  onSubmitted,
}: ContainerStopModalProps) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const version = instance.version ?? (await getInstance(instance.id)).version;
      return stopInstance(instance.id, { expected_version: version });
    },
    meta: {
      feedback: {
        channel: "notification",
        id: withId("instance-command", "stop", instance.id),
        action: "停止",
        successText: "停止已提交",
        errorFallback: "停止失败，请刷新后重试",
      },
    },
    // TODO(container-task): 停止受理后仅刷新资源并关闭确认框，任务进度后续统一接入。
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["legacy-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-runtime", instance.id] }),
        qc.invalidateQueries({
          queryKey: ["governance-instance", instance.id],
          refetchType: "active",
        }),
        qc.invalidateQueries({ queryKey: ["legacy-instance", instance.id], refetchType: "active" }),
      ]);
      onSubmitted();
    },
  });
  return (
    <Modal
      visible
      title="停止容器"
      confirmLoading={mutation.isPending}
      onOk={() => mutation.mutateAsync()}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
    >
      确认停止“{instance.name}”？
    </Modal>
  );
}
