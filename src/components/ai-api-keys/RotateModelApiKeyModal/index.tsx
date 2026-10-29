import { useRef } from "react";
import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rotateInferenceKey,
  type InferenceKey,
  type InferenceKeyCredentials,
} from "@/api/inference-keys";
import { withId } from "@/lib/id";

type RotateModelApiKeyModalProps = {
  apiKey: InferenceKey;
  onCancel: () => void;
  onRotated: (credentials: InferenceKeyCredentials) => void;
};

export default function RotateModelApiKeyModal({
  apiKey,
  onCancel,
  onRotated,
}: RotateModelApiKeyModalProps) {
  const submitting = useRef(false);
  const qc = useQueryClient();
  const rotate = useMutation({
    mutationFn: () => rotateInferenceKey(apiKey.id),
    meta: {
      feedback: {
        channel: "notification",
        id: withId("inference-key-rotate", apiKey.id),
        action: "重置模型 API Key",
        successText: "模型 API Key 已重置",
        errorFallback: "重置模型 API Key 失败",
      },
    },
    onSuccess: async (credentials) => {
      const secretKey = ["governance-inference-key-secret", apiKey.id];
      await qc.cancelQueries({ queryKey: secretKey });
      qc.removeQueries({ queryKey: secretKey });
      onRotated(credentials);
      return Promise.all([
        qc.invalidateQueries({
          queryKey: ["governance-inference-keys"],
          predicate: (query) => query.queryKey[1] !== "options",
        }),
        qc.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
      ]);
    },
  });

  const submit = async () => {
    if (submitting.current || apiKey.revoked_at) return;
    submitting.current = true;
    try {
      await rotate.mutateAsync();
    } catch {
      // 统一反馈入口展示错误，保留确认弹窗及幂等上下文供重试。
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal
      visible
      title={`重置模型 API Key · ${apiKey.name}`}
      okText="确认重置"
      okButtonProps={{ status: "danger", disabled: Boolean(apiKey.revoked_at) }}
      confirmLoading={rotate.isPending}
      onOk={submit}
      onCancel={() => {
        if (!submitting.current) onCancel();
      }}
      closable={!rotate.isPending}
      escToExit={!rotate.isPending}
      maskClosable={false}
      cancelButtonProps={{ disabled: rotate.isPending }}
    >
      <div>重置后旧密钥将立即失效，请更新调用方。之后也可通过“查看密钥”获取当前值。</div>
    </Modal>
  );
}
