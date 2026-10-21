import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stopInstance, type InstanceRecord } from "@/api/instances";
import { withId } from "@/lib/id";

type GpuContainerStopModalProps = {
  instance: Pick<InstanceRecord, "id" | "name" | "version">;
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function GpuContainerStopModal({
  instance,
  onCancel,
  onSubmitted,
}: GpuContainerStopModalProps) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => stopInstance(instance.id, { expected_version: instance.version }),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("instance-command", "stop", instance.id),
        action: "停止",
        successText: "停止已提交",
        errorFallback: "停止失败，请刷新后重试",
      },
    },
    // TODO(gpu-container-stop): 联调验证停止受理、expected_version 冲突及用户卷保留；停止不表示 GPU 配额已归还。
    // TODO(container-task): 停止受理后仅刷新资源并关闭确认框，任务进度后续统一接入。
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-runtime", instance.id] }),
        qc.invalidateQueries({
          queryKey: ["governance-instance", instance.id],
          refetchType: "active",
        }),
      ]);
      onSubmitted();
    },
  });
  return (
    <Modal
      visible
      title="停止 GPU 容器"
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
