import { useState } from "react";
import { Alert, Button, Modal, Space, Typography } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCopy, IconExclamationCircleFill } from "@arco-design/web-react/icon";
import {
  issueImagePublisherCredential,
  resetImagePublisherCredential,
  type ImageCredentialDelivery,
  type ImagePublisherCredential,
} from "@/api/images";
import { copyToClipboard } from "@/lib/clipboard";

type IssueImageCredentialModalProps = {
  credential: ImagePublisherCredential;
  action: "issue" | "reset";
  onCancel: () => void;
};

export default function IssueImageCredentialModal({
  credential,
  action,
  onCancel,
}: IssueImageCredentialModalProps) {
  const [delivery, setDelivery] = useState<ImageCredentialDelivery>();
  const client = useQueryClient();
  const reset = action === "reset";
  const mutation = useMutation({
    // Keep the secret only in this mounted dialog, never in MutationCache.
    mutationFn: async () => {
      const result = await (reset ? resetImagePublisherCredential : issueImagePublisherCredential)({
        expectedVersion: credential.version,
      });
      setDelivery(result);
    },
    meta: {
      feedback: {
        channel: "notification",
        id: reset ? "image-credential-reset" : "image-credential-issue",
        action: reset ? "重置发布凭证" : "签发发布凭证",
        successDescription: "请保存本次发布凭证",
        errorFallback: "操作失败",
      },
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["image-publisher-credential"] }),
  });
  return (
    <Modal
      visible
      title={
        <span>
          {reset && !delivery && <IconExclamationCircleFill />}
          {reset ? "重置发布凭证" : "签发发布凭证"}
        </span>
      }
      onCancel={onCancel}
      escToExit={!mutation.isPending}
      closable={!mutation.isPending}
      footer={
        delivery ? (
          <Button type="primary" onClick={onCancel}>
            已保存
          </Button>
        ) : undefined
      }
      cancelButtonProps={{ disabled: mutation.isPending }}
      confirmLoading={mutation.isPending}
      okButtonProps={reset ? { status: "danger" } : undefined}
      onOk={() => mutation.mutateAsync()}
      okText={reset ? "确认重置" : "确认签发"}
    >
      {delivery ? (
        <Space direction="vertical" className="w-full" size={16}>
          <Alert
            type="info"
            showIcon={false}
            content="密钥仅在当前弹窗展示，请立即保存。不要将其放入镜像地址或公开脚本中。"
          />
          {[
            { label: "用户名", value: delivery.credential.username },
            { label: "发布密钥", value: delivery.secret },
          ].map(({ label, value }) => (
            <div key={label}>
              <Typography.Text bold>{label}</Typography.Text>
              <div className="mt-2 flex items-start gap-2">
                <code className="min-w-0 flex-1 self-center font-mono break-all select-text">
                  {value || "-"}
                </code>
                <Button
                  type="text"
                  size="mini"
                  className="shrink-0"
                  icon={<IconCopy />}
                  title={`复制${label}`}
                  aria-label={`复制${label}`}
                  disabled={!value}
                  onClick={() => copyToClipboard(value || "", label)}
                />
              </div>
            </div>
          ))}
        </Space>
      ) : (
        <Space direction="vertical" className="w-full">
          {!reset && (
            <Alert
              type="info"
              content="为当前租户镜像空间签发发布凭证。签发成功后请立即保存密钥。"
            />
          )}
          <Typography.Paragraph type="secondary">
            若其他管理员已修改凭证，请关闭弹窗并刷新凭证信息后重新操作。请求失败时可在本弹窗重试。
          </Typography.Paragraph>
        </Space>
      )}
    </Modal>
  );
}
