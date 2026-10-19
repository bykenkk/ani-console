import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getInstance, stopInstance, type InstanceAcceptance } from "@/api/instances";
import { withId } from "@/lib/id";
export default function ContainerStopModal({
  instance,
  onCancel,
  onSubmitted,
}: {
  instance: { id: string; name: string; version?: string };
  onCancel: () => void;
  onSubmitted: (result: InstanceAcceptance) => void;
}) {
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
    onSuccess: async (result) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["legacy-instances"] }),
        qc.invalidateQueries({
          queryKey: ["governance-instance", instance.id],
          refetchType: "active",
        }),
        qc.invalidateQueries({ queryKey: ["legacy-instance", instance.id], refetchType: "active" }),
      ]);
      onSubmitted(result);
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
