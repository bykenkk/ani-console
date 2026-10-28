import { useState } from "react";
import { Tag } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import {
  listInferenceKeys,
  type InferenceKey,
  type InferenceKeyCredentials,
} from "@/api/inference-keys";
import { ListDataTable, ListPageFrame, ResourceNameId, type ListColumn } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { formatDateTime, isDateTimeExpired } from "@/lib/date";
import { showMessage } from "@/lib/feedback";
import CreateModelApiKeyModal from "../CreateModelApiKeyModal";
import ModelApiKeyCredentialsModal from "../ModelApiKeyCredentialsModal";
import RevokeModelApiKeyModal from "../RevokeModelApiKeyModal";
import RotateModelApiKeyModal from "../RotateModelApiKeyModal";

type ModelApiKeyAction = {
  type: "revoke" | "rotate";
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
    title: "授权模型",
    width: 220,
    ellipsis: true,
    render: (_, item) => item.allowed_model_names?.join("、") || "未限制模型",
  },
  {
    title: "调用限额",
    width: 380,
    ellipsis: true,
    render: (_, item) =>
      [
        item.requests_per_second ? `每秒${item.requests_per_second}次` : undefined,
        item.requests_per_minute ? `每分钟${item.requests_per_minute}次` : undefined,
        item.requests_per_hour ? `每小时${item.requests_per_hour}次` : undefined,
      ]
        .filter(Boolean)
        .join("，") || "无限制",
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
  const [credentials, setCredentials] = useState<InferenceKeyCredentials | null>(null);
  const [action, setAction] = useState<ModelApiKeyAction | null>(null);
  const { page, pageSize, setPage, setPageSize } = useListPagination("inference-keys", 20);
  const query = useQuery({
    queryKey: ["governance-inference-keys", { page, pageSize }],
    queryFn: ({ signal }) => listInferenceKeys({ page, pageSize }, signal),
    meta: {
      errorNotification: {
        id: "inference-keys",
        action: "模型 API Key 列表加载",
      },
    },
  });

  const changePage = (nextPage: number) => {
    // Governance 当前保留 Inference owner 的 100 页上限；仍展示后端真实总数。
    if (nextPage > 100) {
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
          subtitle: "用于应用调用推理服务；实际访问仍受服务授权与限流策略约束",
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
            setCredentials(result);
            setPage(1);
          }}
        />
      )}
      {credentials && (
        <ModelApiKeyCredentialsModal
          credentials={credentials}
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
            setCredentials(result);
          }}
        />
      )}
    </>
  );
}
