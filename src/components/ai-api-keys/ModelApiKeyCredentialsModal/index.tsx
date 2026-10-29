import { useQuery } from "@tanstack/react-query";
import { getInferenceKey } from "@/api/inference-keys";
import { copyToClipboard } from "@/lib/clipboard";
import { withId } from "@/lib/id";
import { Alert, Button, Modal, Spin, Typography } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";

type ModelApiKeyCredentialsModalProps = {
  keyId: string;
  initialSecret?: string;
  onCancel: () => void;
};

export default function ModelApiKeyCredentialsModal({
  keyId,
  initialSecret,
  onCancel,
}: ModelApiKeyCredentialsModalProps) {
  const detail = useQuery({
    queryKey: ["governance-inference-key-secret", keyId],
    queryFn: ({ signal }) => getInferenceKey(keyId, signal),
    enabled: !initialSecret,
    // 主动查看和幂等重放均读取最新详情；卸载后不保留密钥缓存。
    refetchOnMount: "always",
    gcTime: 0,
    meta: {
      errorNotification: {
        id: withId("inference-key-secret", keyId),
        action: "模型 API Key 密钥加载",
      },
    },
  });
  const secret = initialSecret || detail.data?.secret;
  return (
    <>
      <Modal
        visible
        title="模型 API Key"
        maskClosable={false}
        onCancel={onCancel}
        style={{ width: 620, maxWidth: "calc(100vw - 48px)" }}
        footer={
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        }
      >
        <div>
          <Alert type="warning" content="API Key 用于调用模型，请妥善保管，避免泄露。" />
          <Spin loading={detail.isFetching} className="mt-4 w-full">
            <div className="flex items-start gap-2">
              <code className="min-w-0 self-center font-mono break-all select-text">
                {secret || "暂无可展示的密钥"}
              </code>
              <Button
                type="text"
                size="mini"
                className="shrink-0"
                icon={<IconCopy />}
                title="复制模型 API Key"
                aria-label="复制模型 API Key"
                disabled={!secret?.trim() || detail.isFetching}
                onClick={() => {
                  if (secret) return copyToClipboard(secret, "模型 API Key");
                }}
              />
            </div>
            {detail.isSuccess && !secret?.trim() && (
              <Typography.Paragraph type="secondary" className="mt-3 mb-0!">
                此历史记录没有可恢复的密钥。请关闭弹窗后主动重置，并更新调用方使用的密钥。
              </Typography.Paragraph>
            )}
          </Spin>
        </div>
      </Modal>
    </>
  );
}
