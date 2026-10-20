import { Modal } from "@arco-design/web-react";
import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances/legacy";
import { useMutation } from "@tanstack/react-query";

type VmStopModalProps = {
  instance: Instance;
  onCancel: () => void;
  onSubmitted: (operationId: string) => void;
};

type Instance = InstanceRecord;

export default function VmStopModal({ instance, onCancel, onSubmitted }: VmStopModalProps) {
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "操作",
        successText: "关机已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async () => {
      const submitData = { action: "stop" as const };
      const data = await applyInstanceLifecycle(instance.id, submitData);
      return data.operation_id;
    },
    onSuccess: (operationId) => {
      onSubmitted(operationId);
    },
  });
  return (
    <Modal
      title="关闭云主机"
      visible
      confirmLoading={mutation.isPending}
      onCancel={() => {
        onCancel();
      }}
      onOk={() => mutation.mutate()}
      unmountOnExit
    >
      确定关闭「{instance.name}」？
    </Modal>
  );
}
