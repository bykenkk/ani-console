import { useRef } from "react";
import { Alert, Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bindInferenceKeyPolicy, type InferenceKey } from "@/api/inference-keys";
import { showMessage } from "@/lib/feedback";
import { validateForm } from "@/lib/form";
import ModelApiKeyPolicyField from "../ModelApiKeyPolicyField";

type BindModelApiKeyPolicyModalProps = {
  apiKey: InferenceKey;
  onCancel: () => void;
  onBound: () => void;
};
interface BindModelApiKeyPolicyFormValues {
  policy_id: string;
}

export default function BindModelApiKeyPolicyModal({
  apiKey,
  onCancel,
  onBound,
}: BindModelApiKeyPolicyModalProps) {
  const [form] = Form.useForm<BindModelApiKeyPolicyFormValues>();
  const submitting = useRef(false);
  const qc = useQueryClient();
  const bind = useMutation({
    mutationFn: (policyId: string) => bindInferenceKeyPolicy(apiKey.id, policyId),
    meta: {
      feedback: { channel: "message", action: "更换访问策略", successText: "访问策略已更换" },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: ["governance-inference-keys"],
          predicate: (query) => query.queryKey[1] !== "options",
        }),
        qc.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
      ]);
      onBound();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<BindModelApiKeyPolicyFormValues>(form);
      if (values.policy_id === apiKey.policy_id) {
        showMessage({ type: "info", content: "访问策略未变化" });
        return;
      }
      await bind.mutateAsync(values.policy_id);
    } catch {
      /* 表单和请求错误由统一反馈处理。 */
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title={`更换策略 · ${apiKey.name}`}
      okText="保存"
      onOk={submit}
      onCancel={() => {
        if (!submitting.current) onCancel();
      }}
      confirmLoading={bind.isPending}
      closable={!bind.isPending}
      escToExit={!bind.isPending}
      maskClosable={false}
      cancelButtonProps={{ disabled: bind.isPending }}
      style={{ width: 680, maxWidth: "calc(100vw - 48px)" }}
    >
      <Alert
        className="mb-4"
        type="warning"
        content="更换后按新策略授权和限流，密钥值保持不变，已有请求计数不会清零。"
      />
      <Form
        form={form}
        layout="vertical"
        disabled={bind.isPending}
        initialValues={{ policy_id: apiKey.policy_id || undefined }}
      >
        <ModelApiKeyPolicyField disabled={bind.isPending} />
      </Form>
    </Modal>
  );
}
