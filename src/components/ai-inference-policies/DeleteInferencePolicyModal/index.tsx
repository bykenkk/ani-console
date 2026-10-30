import { useRef } from "react";
import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInferencePolicy, type InferencePolicy } from "@/api/inference-policies";
import { ResourceNameId } from "@/components/common";
import { withId } from "@/lib/id";

type DeleteInferencePolicyModalProps = {
  policy: InferencePolicy;
  onCancel: () => void;
  onDeleted: () => void;
};

export default function DeleteInferencePolicyModal({
  policy,
  onCancel,
  onDeleted,
}: DeleteInferencePolicyModalProps) {
  const submitting = useRef(false);
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteInferencePolicy(policy.id),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("inference-policy-delete", policy.id),
        action: "删除访问策略",
        successText: "访问策略已删除",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["governance-inference-policies"] }),
        queryClient.invalidateQueries({
          queryKey: ["governance-inference-policy", policy.id],
          exact: true,
          refetchType: "none",
        }),
        queryClient.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
      ]);
      onDeleted();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await remove.mutateAsync();
    } catch {
      /* 失败由统一反馈处理，保留弹窗。 */
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title="删除访问策略"
      okText="确认删除"
      okButtonProps={{ status: "danger" }}
      onOk={submit}
      onCancel={() => {
        if (!submitting.current) onCancel();
      }}
      confirmLoading={remove.isPending}
      closable={!remove.isPending}
      escToExit={!remove.isPending}
      maskClosable={false}
      cancelButtonProps={{ disabled: remove.isPending }}
    >
      <div className="flex w-full flex-col gap-4">
        <ResourceNameId name={policy.name} id={policy.id} openable={false} />
        <div>删除后不可恢复。仍被 API Key 绑定的策略无法删除。</div>
      </div>
    </Modal>
  );
}
