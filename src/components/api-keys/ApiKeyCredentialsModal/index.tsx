import type { ApiKeyCredentials } from "@/api/api-keys";
import { copyToClipboard } from "@/lib/clipboard";
import { Alert, Button, Modal, Space, Typography } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";

type ApiKeyCredentialsModalProps = {
  credentials: ApiKeyCredentials;
  onCancel: () => void;
};

export function ApiKeyCredentialsModal({ credentials, onCancel }: ApiKeyCredentialsModalProps) {
  return (
    <Modal
      visible
      title="请妥善保存 API Key"
      closable={false}
      escToExit={false}
      onCancel={onCancel}
      footer={
        <Button type="primary" onClick={onCancel}>
          我已保存
        </Button>
      }
      style={{ width: 600 }}
    >
      <Space direction="vertical" size={16} className="w-full">
        <Alert
          type="warning"
          showIcon
          content="Secret Key 仅在创建或重置时完整展示一次，关闭后无法再次查看。"
        />
        <div>
          <Typography.Text bold>Access Key</Typography.Text>
          <div className="mt-2 flex items-start gap-2">
            <code className="min-w-0 flex-1 self-center font-mono break-all select-text">
              {credentials.data.access_key}
            </code>
            <Button
              type="text"
              size="mini"
              className="shrink-0"
              icon={<IconCopy />}
              title="复制 Access Key"
              aria-label="复制 Access Key"
              onClick={() => copyToClipboard(credentials.data.access_key, "Access Key")}
            />
          </div>
        </div>
        <div>
          <Typography.Text bold>Secret Key</Typography.Text>
          <div className="mt-2 flex items-start gap-2">
            <code className="min-w-0 flex-1 self-center font-mono break-all select-text">
              {credentials.secret_key}
            </code>
            <Button
              type="text"
              size="mini"
              className="shrink-0"
              icon={<IconCopy />}
              title="复制 Secret Key"
              aria-label="复制 Secret Key"
              onClick={() => copyToClipboard(credentials.secret_key, "Secret Key")}
            />
          </div>
        </div>
      </Space>
    </Modal>
  );
}
