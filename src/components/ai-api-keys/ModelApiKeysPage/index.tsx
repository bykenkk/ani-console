import { useState } from "react";
import { Tag } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listInferenceKeys, type InferenceKey } from "@/api/inference-keys";
import { ListDataTable, ListPageFrame, ResourceNameId, type ListColumn } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { formatDateTime, isDateTimeExpired } from "@/lib/date";
import { showMessage } from "@/lib/feedback";
import CreateModelApiKeyModal from "../CreateModelApiKeyModal";
import ModelApiKeyCredentialsModal from "../ModelApiKeyCredentialsModal";
import RevokeModelApiKeyModal from "../RevokeModelApiKeyModal";
import RotateModelApiKeyModal from "../RotateModelApiKeyModal";
import BindModelApiKeyPolicyModal from "../BindModelApiKeyPolicyModal";
import ModelApiKeyPolicy from "../ModelApiKeyPolicy";

type ModelApiKeyAction = {
  type: "revoke" | "rotate" | "bind";
  apiKey: InferenceKey;
};

const columns: ListColumn<InferenceKey>[] = [
  {
    title: "名称 / ID",
    width: 200,
    fixed: "left",
    render: (_, item) => <ResourceNameId name={item.name} id={item.id} openable={false} />,
  },
  {
    title: "Key 前缀",
    dataIndex: "key_prefix",
    width: 180,
    ellipsis: true,
  },
  {
    title: "状态",
    width: 120,
    render: (_, item) => {
      if (item.revoked_at) return <Tag color="red">已撤销</Tag>;
      if (isDateTimeExpired(item.expires_at)) return <Tag color="gray">已过期</Tag>;
      return <Tag color="green">有效</Tag>;
    },
  },
  {
    title: "访问策略",
    width: 240,
    render: (_, item) => <ModelApiKeyPolicy policyId={item.policy_id} />,
  },
  {
    title: "过期时间",
    width: 180,
    render: (_, item) => (item.expires_at ? formatDateTime(item.expires_at) : "永不过期"),
  },
  {
    title: "最近使用时间",
    width: 180,
    render: (_, item) => formatDateTime(item.last_used_at),
  },
  {
    title: "创建时间",
    width: 180,
    render: (_, item) => formatDateTime(item.created_at),
  },
  {
    title: "撤销时间",
    width: 180,
    render: (_, item) => formatDateTime(item.revoked_at),
  },
];

export default function ModelApiKeysPage() {
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<{ keyId: string; secret?: string } | null>(null);
  const [action, setAction] = useState<ModelApiKeyAction | null>(null);
  const { page, pageSize, setPage, setPageSize } = useListPagination("inference-keys", 20);
  const query = useQuery({
    queryKey: ["governance-inference-keys", { page, pageSize }],
    queryFn: async ({ signal }) => {
      const response = await listInferenceKeys({ page, pageSize }, signal);
      // 管理表格仅保存元数据，查看密钥由用户主动读取详情。
      return { ...response, items: response.items.map((key) => ({ ...key, secret: undefined })) };
    },
    meta: {
      errorNotification: {
        id: "inference-keys",
        action: "模型 API Key 列表加载",
      },
    },
  });

  const changePage = (nextPage: number) => {
    // Governance 当前保留 Inference owner 的 100 页上限；仍展示后端真实总数。
    if (nextPage < 1 || nextPage > 100) {
      showMessage({
        type: "warning",
        content: "最多支持访问第 100 页，可增加每页条数查看更多记录",
      });
      return;
    }
    setPage(nextPage);
  };

  return (
    <>
      <ListPageFrame
        header={{
          title: "模型 API Key",
          iconClassName: "icon-Ukeyguanli",
          subtitle: "绑定访问策略后调用模型，各 API Key 按策略分别计数",
          actions: [
            {
              key: "create",
              label: "创建模型 API Key",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreating(true),
            },
          ],
        }}
        toolbar={{
          refresh: {
            onClick: () => query.refetch(),
            spinning: query.isFetching,
            disabled: query.isFetching,
          },
        }}
      >
        <ListDataTable
          tableLabel="模型 API Key 列表"
          data={query.data?.items ?? []}
          columns={columns}
          loading={query.isFetching}
          emptyText="暂无模型 API Key"
          rowActions={[
            {
              key: "view-secret",
              label: "查看密钥",
              disabled: () => action !== null,
              onClick: (item) => setCredentials({ keyId: item.id }),
            },
            {
              key: "bind",
              label: "更换策略",
              disabled: () => action !== null,
              onClick: (item) => setAction({ type: "bind", apiKey: item }),
            },
            {
              key: "rotate",
              label: "重置",
              intent: "warning",
              disabled: (item) => Boolean(item.revoked_at) || action !== null,
              tooltip: (item) => (item.revoked_at ? "已撤销的 Key 无法重置" : undefined),
              onClick: (item) => setAction({ type: "rotate", apiKey: item }),
            },
            {
              key: "revoke",
              label: "撤销",
              intent: "danger",
              disabled: (item) => Boolean(item.revoked_at) || action !== null,
              tooltip: (item) => (item.revoked_at ? "该 Key 已撤销" : undefined),
              onClick: (item) => setAction({ type: "revoke", apiKey: item }),
            },
          ]}
          pagination={{
            page,
            pageSize,
            total: Number(query.data?.total ?? "0"),
            disabled: query.isFetching,
            pageSizeOptions: [10, 20, 50, 100],
            onPageChange: changePage,
            onPageSizeChange: setPageSize,
          }}
        />
      </ListPageFrame>
      {creating && (
        <CreateModelApiKeyModal
          onCancel={() => setCreating(false)}
          onCreated={(result) => {
            setCreating(false);
            setCredentials({ keyId: result.key.id, secret: result.secret });
            setPage(1);
          }}
        />
      )}
      {credentials && (
        <ModelApiKeyCredentialsModal
          keyId={credentials.keyId}
          initialSecret={credentials.secret}
          onCancel={() => setCredentials(null)}
        />
      )}
      {action?.type === "revoke" && (
        <RevokeModelApiKeyModal
          apiKey={action.apiKey}
          onCancel={() => setAction(null)}
          onRevoked={() => setAction(null)}
        />
      )}
      {action?.type === "rotate" && (
        <RotateModelApiKeyModal
          apiKey={action.apiKey}
          onCancel={() => setAction(null)}
          onRotated={(result) => {
            setAction(null);
            setCredentials({ keyId: result.key.id, secret: result.secret });
          }}
        />
      )}
      {action?.type === "bind" && (
        <BindModelApiKeyPolicyModal
          apiKey={action.apiKey}
          onCancel={() => setAction(null)}
          onBound={() => setAction(null)}
        />
      )}
    </>
  );
}
