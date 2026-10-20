import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getInstance, deleteInstance } from "@/api/instances";
import { withId } from "@/lib/id";

type ContainerDeleteModalProps = {
  instance: { id: string; name: string; version?: string };
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function ContainerDeleteModal({
  instance,
  onCancel,
  onSubmitted,
}: ContainerDeleteModalProps) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const version = instance.version ?? (await getInstance(instance.id)).version;
      return deleteInstance(instance.id, { expected_version: version });
    },
    meta: {
      feedback: {
        channel: "notification",
        id: withId("instance-command", "delete", instance.id),
        action: "删除",
        successText: "删除已提交",
        errorFallback: "删除失败，请刷新后重试",
      },
    },
    // TODO(container-task): 删除任务跟踪后续统一接入，当前仅提交请求并提示。
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["legacy-instances"] }),
        qc.invalidateQueries({
          queryKey: ["governance-instance", instance.id],
          refetchType: "none",
        }),
        qc.invalidateQueries({ queryKey: ["legacy-instance", instance.id], refetchType: "none" }),
      ]);
      onSubmitted();
    },
  });
  return (
    <Modal
      visible
      title="删除容器"
      confirmLoading={mutation.isPending}
      okButtonProps={{ status: "danger" }}
      onOk={() => mutation.mutateAsync()}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
    >
      确认删除“{instance.name}”？实例及工作空间数据将被清理，无法恢复。
    </Modal>
  );
}
