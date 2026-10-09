import type { ApiKeyCredentials } from "@/api/api-keys";
import { copyToClipboard } from "@/lib/clipboard";
import { Alert, Button, Input, Modal, Space, Typography } from "@arco-design/web-react";

export function ApiKeyCredentialsModal({
  credentials,
  onCancel,
}: {
  credentials: ApiKeyCredentials;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible
      title="请妥善保存 API Key"
      closable={false}
      maskClosable={false}
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
          <Space className="mt-2 w-full" align="start">
            <Input.TextArea
              aria-label="Access Key"
              value={credentials.data.access_key}
              readOnly
              autoSize={{ minRows: 1, maxRows: 2 }}
            />
            <Button onClick={() => copyToClipboard(credentials.data.access_key, "Access Key")}>
              复制
            </Button>
          </Space>
        </div>
        <div>
          <Typography.Text bold>Secret Key</Typography.Text>
          <Space className="mt-2 w-full" align="start">
            <Input.TextArea
              aria-label="Secret Key"
              value={credentials.secret_key}
              readOnly
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Button onClick={() => copyToClipboard(credentials.secret_key, "Secret Key")}>
              复制
            </Button>
          </Space>
        </div>
      </Space>
    </Modal>
  );
}
