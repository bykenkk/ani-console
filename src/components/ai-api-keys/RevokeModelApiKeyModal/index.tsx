import { useRef } from "react";
import { Modal, Space } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeInferenceKey, type InferenceKey } from "@/api/inference-keys";
import { ResourceNameId } from "@/components/common";
import { withId } from "@/lib/id";

type RevokeModelApiKeyModalProps = {
  apiKey: InferenceKey;
  onCancel: () => void;
  onRevoked: () => void;
};

export default function RevokeModelApiKeyModal({
  apiKey,
  onCancel,
  onRevoked,
}: RevokeModelApiKeyModalProps) {
  const submitting = useRef(false);
  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => revokeInferenceKey(apiKey.id),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("inference-key-revoke", apiKey.id),
        action: "撤销模型 API Key",
        successText: "模型 API Key 已撤销",
        errorFallback: "撤销模型 API Key 失败",
      },
    },
    onSuccess: async () => {
      const secretKey = ["governance-inference-key-secret", apiKey.id];
      await qc.cancelQueries({ queryKey: secretKey });
      qc.removeQueries({ queryKey: secretKey });
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["governance-inference-keys"],
          predicate: (query) => query.queryKey[1] !== "options",
        }),
        qc.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
      ]);
      onRevoked();
    },
  });

  const submit = async () => {
    if (submitting.current || apiKey.revoked_at) return;
    submitting.current = true;
    try {
      await revoke.mutateAsync();
    } catch {
      // 统一反馈入口展示错误，保留确认弹窗供重试。
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal
      visible
      title="撤销模型 API Key"
      okText="确认撤销"
      okButtonProps={{ status: "danger", disabled: Boolean(apiKey.revoked_at) }}
      confirmLoading={revoke.isPending}
      onOk={submit}
      onCancel={() => {
        if (!submitting.current) onCancel();
      }}
      closable={!revoke.isPending}
      escToExit={!revoke.isPending}
      maskClosable={false}
      cancelButtonProps={{ disabled: revoke.isPending }}
    >
      <Space direction="vertical" size={16} className="w-full">
        <ResourceNameId name={apiKey.name} id={apiKey.id} openable={false} />
        <div>撤销后，此 Key 将无法调用推理服务，历史记录仍会保留。</div>
      </Space>
    </Modal>
  );
}
