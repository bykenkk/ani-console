import { useState } from "react";
import { Alert, Button, Modal, Space, Typography } from "@arco-design/web-react";
import type { InferenceKeyCredentials } from "@/api/inference-keys";
import { ResourceNameId } from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";
import RotateModelApiKeyModal from "../RotateModelApiKeyModal";

type ModelApiKeyCredentialsModalProps = {
  credentials: InferenceKeyCredentials;
  onCancel: () => void;
};

export default function ModelApiKeyCredentialsModal({
  credentials,
  onCancel,
}: ModelApiKeyCredentialsModalProps) {
  const [current, setCurrent] = useState(credentials);
  const [rotating, setRotating] = useState(false);
  const hasSecret = !current.replayed && Boolean(current.secret);

  return (
    <>
      <Modal
        visible
        title={hasSecret ? "请保存模型 API Key" : "模型 API Key 未返回明文"}
        closable={false}
        escToExit={false}
        maskClosable={false}
        onCancel={onCancel}
        style={{ width: 620, maxWidth: "calc(100vw - 48px)" }}
        footer={
          <Button type="primary" disabled={rotating} onClick={onCancel}>
            {hasSecret ? "我已保存" : "关闭"}
          </Button>
        }
      >
        <Space direction="vertical" size={16} className="w-full">
          <ResourceNameId name={current.key.name} id={current.key.id} openable={false} />
          <Alert
            type="warning"
            showIcon
            content={
              hasSecret
                ? "密钥仅在本次展示，关闭后无法再次查看，请立即复制保存。"
                : "本次操作已完成，但未返回密钥明文。如未保存之前的密钥，可重置生成新密钥。"
            }
          />
          {hasSecret ? (
            <>
              <Typography.Text bold>模型 API Key</Typography.Text>
              <code className="block font-mono break-all select-text">{current.secret}</code>
              <Button onClick={() => copyToClipboard(current.secret!, "模型 API Key")}>
                复制密钥
              </Button>
              <Typography.Text type="secondary">
                外部调用推理服务时，将此密钥填入 x-api-key 请求头。
              </Typography.Text>
            </>
          ) : (
            <Button
              onClick={() => setRotating(true)}
              disabled={rotating || Boolean(current.key.revoked_at)}
            >
              重置
            </Button>
          )}
        </Space>
      </Modal>
      {rotating && (
        <RotateModelApiKeyModal
          apiKey={current.key}
          onCancel={() => setRotating(false)}
          onRotated={(result) => {
            setRotating(false);
            setCurrent(result);
          }}
        />
      )}
    </>
  );
}
