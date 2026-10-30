import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restartInstance, getInstance, type InstanceRecord } from "@/api/instances";
import { ApiError } from "@/api/request";
import { withId } from "@/lib/id";

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
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["instance-command", instance.id, "restart"],
    retry: false,
    mutationFn: async () => {
      const latest = await getInstance(instance.id);
      if (latest.activeOperationId || latest.desiredState === "deleted") {
        throw new Error("实例已有进行中的操作或正在删除，请刷新后确认");
      }
      try {
        await restartInstance(instance.id, { expectedVersion: latest.version });
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === "INSTANCE_VERSION_CONFLICT") {
            error.message = "实例版本已变化，请重新打开操作并确认";
          } else if (error.status === 503 && error.code === "INSTANCE_ACTION_UNAVAILABLE") {
            error.message = "当前环境暂未开放此操作";
          } else if (error.code === "INSTANCE_OPERATION_IN_PROGRESS") {
            error.message = "实例已有进行中的操作，请等待完成后再操作";
          }
        }
        throw error;
      }
    },
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
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance", instance.id] }),
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
      PVC 中已保存的数据保留。
    </Modal>
  );
}
