import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInstance, type InstanceRecord } from "@/api/instances";
import { withId } from "@/lib/id";

type GpuContainerDeleteModalProps = {
  instance: Pick<InstanceRecord, "id" | "name" | "version">;
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function GpuContainerDeleteModal({
  instance,
  onCancel,
  onSubmitted,
}: GpuContainerDeleteModalProps) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteInstance(instance.id, { expected_version: instance.version }),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("instance-command", "delete", instance.id),
        action: "删除",
        successText: "删除已提交",
        errorFallback: "删除失败，请刷新后重试",
      },
    },
    // TODO(gpu-container-delete): 联调验证删除受理、最终 GPU 释放与退额、工作空间清理和用户卷保留。
    // TODO(container-task): 删除任务跟踪后续统一接入，当前仅提交请求并提示。
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({
          queryKey: ["governance-instance", instance.id],
          refetchType: "none",
        }),
      ]);
      onSubmitted();
    },
  });
  return (
    <Modal
      visible
      title="删除 GPU 容器"
      confirmLoading={mutation.isPending}
      okButtonProps={{ status: "danger" }}
      onOk={() => mutation.mutateAsync()}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
    >
      确认删除“{instance.name}”？实例及工作空间数据将被清理，无法恢复。已挂载的用户存储卷会保留。
    </Modal>
  );
}
