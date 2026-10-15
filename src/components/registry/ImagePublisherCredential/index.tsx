import { useState } from "react";
import { Button, Descriptions, Modal, Space, Spin, Typography } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disableImagePublisherCredential,
  getImagePublisherCredential,
  type ImagePublisherCredential as Credential,
} from "@/api/images";
import { formatDateTime } from "@/lib/format";
import { IMAGE_CREDENTIAL_STATES } from "../options";
import IssueImageCredentialModal from "../IssueImageCredentialModal";

export default function ImagePublisherCredential({ available }: { available: boolean }) {
  const [operation, setOperation] = useState<{
    action: "issue" | "reset";
    credential: Credential;
  }>();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["image-publisher-credential"],
    queryFn: ({ signal }) => getImagePublisherCredential(signal),
    meta: {
      errorNotification: {
        id: "image-publisher-credential",
        action: "发布凭证加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const disable = useMutation({
    mutationFn: (credential: Credential) =>
      disableImagePublisherCredential({ expectedVersion: credential.version }),
    meta: {
      feedback: {
        channel: "notification",
        id: "image-credential-disable",
        action: "停用发布凭证",
        successText: "发布凭证已停用",
        errorFallback: "停用失败",
      },
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["image-publisher-credential"] }),
  });
  const credential = query.data;
  const busy = query.isFetching || disable.isPending || Boolean(operation);
  return (
    <Space direction="vertical" className="w-full" size="medium">
      <div className="flex items-center justify-between">
        <Typography.Title heading={6} className="m-0!">
          发布凭证
        </Typography.Title>
        <Button size="small" loading={query.isFetching} onClick={() => query.refetch()}>
          刷新
        </Button>
      </div>
      <Spin loading={query.isLoading} className="w-full">
        <Descriptions
          column={1}
          data={[
            {
              label: "状态",
              value: credential
                ? IMAGE_CREDENTIAL_STATES[credential.state] || credential.state
                : "-",
            },
            { label: "用户名", value: credential?.username || "-" },
            {
              label: "到期时间",
              value: credential?.expiresAt ? formatDateTime(credential.expiresAt) : "-",
            },
          ]}
        />
      </Spin>
      <Space>
        <Button
          disabled={
            !available ||
            busy ||
            !credential ||
            !["not_issued", "disabled"].includes(credential.state)
          }
          onClick={() => credential && setOperation({ action: "issue", credential })}
        >
          签发凭证
        </Button>
        <Button
          status="warning"
          disabled={!available || busy || credential?.state !== "active"}
          onClick={() => credential && setOperation({ action: "reset", credential })}
        >
          重置凭证
        </Button>
        <Button
          status="danger"
          loading={disable.isPending}
          disabled={busy || !credential || !["active", "blocked"].includes(credential.state)}
          onClick={() => {
            if (!credential) return;
            Modal.confirm({
              title: "停用发布凭证",
              content: "停用当前发布凭证后，使用该凭证的镜像发布操作将无法继续。",
              okButtonProps: { status: "danger" },
              onOk: () => disable.mutateAsync(credential),
            });
          }}
        >
          停用凭证
        </Button>
      </Space>
      {operation && (
        <IssueImageCredentialModal
          credential={operation.credential}
          action={operation.action}
          onCancel={() => setOperation(undefined)}
        />
      )}
    </Space>
  );
}
