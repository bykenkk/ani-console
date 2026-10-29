import type { InferenceKeyCredentials } from "@/api/inference-keys";
import { copyToClipboard } from "@/lib/clipboard";
import { Alert, Button, Modal } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";

type ModelApiKeyCredentialsModalProps = {
  credentials: InferenceKeyCredentials;
  onCancel: () => void;
};

export default function ModelApiKeyCredentialsModal({
  credentials,
  onCancel,
}: ModelApiKeyCredentialsModalProps) {
  return (
    <>
      <Modal
        visible
        title="模型 API Key"
        closable={false}
        escToExit={false}
        maskClosable={false}
        onCancel={onCancel}
        style={{ width: 620, maxWidth: "calc(100vw - 48px)" }}
        footer={
          <Button type="primary" onClick={onCancel}>
            我已保存
          </Button>
        }
      >
        <div>
          <Alert type="warning" content="API Key 用于调用模型，请妥善保管，避免泄露。" />
          <div className="mt-2 flex items-start gap-1">
            <code className="min-w-0 self-center font-mono break-all select-text">
              {credentials.secret}
            </code>
            <Button
              type="text"
              size="mini"
              className="shrink-0"
              icon={<IconCopy />}
              title="复制模型 API Key"
              aria-label="复制模型 API Key"
              onClick={() => copyToClipboard(credentials.secret!, "模型 API Key")}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
