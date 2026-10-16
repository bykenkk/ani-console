import {
  deleteApiKey,
  listApiKeys,
  resetApiKeySecret,
  updateApiKey,
  type ApiKeyCredentials,
  type ApiKeyRecord,
} from "@/api/api-keys";
import { ListDataTable, ListPageFrame, type ListColumn } from "@/components/common";
import { ApiKeyCredentialsModal } from "@/components/api-keys/ApiKeyCredentialsModal";
import { CreateApiKeyModal } from "@/components/api-keys/CreateApiKeyModal";
import { formatDateTime, isDateTimeExpired } from "@/lib/date";
import { Modal, Select, Tag } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type StatusFilter = "all" | "active" | "disabled";
type ExpirationFilter = "all" | "never" | "valid" | "expired";
type SearchField = "name" | "access_key";

function isExpired(item: ApiKeyRecord): boolean {
  return Boolean(item.expires_at && isDateTimeExpired(item.expires_at));
}

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);
  const [credentials, setCredentials] = useState<ApiKeyCredentials | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expiration, setExpiration] = useState<ExpirationFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const apiKeys = useQuery({
    meta: {
      errorNotification: {
        id: "api-keys",
        action: "API Key 列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["api-keys"],
    queryFn: ({ signal }) => listApiKeys({}, signal),
  });
  const toggleStatus = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "api-key-status",
        action: "更新 API Key 状态",
        errorFallback: "更新 API Key 状态失败",
      },
    },
    mutationFn: ({ item, active }: { item: ApiKeyRecord; active: boolean }) =>
      updateApiKey(item.id, { is_active: active }, "isActive"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
  const resetSecret = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "api-key-secret-reset",
        action: "重置 Secret Key",
        errorFallback: "重置 Secret Key 失败",
      },
    },
    mutationFn: (item: ApiKeyRecord) => resetApiKeySecret(item.id),
    onSuccess: (nextCredentials) => {
      setCredentials(nextCredentials);
      return queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
  const remove = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "api-key-delete",
        action: "删除 API Key",
        errorFallback: "删除 API Key 失败",
      },
    },
    mutationFn: (item: ApiKeyRecord) => deleteApiKey(item.id),
    onSuccess: () => {
      setPage(1);
      return queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return (apiKeys.data?.items ?? []).filter((item) => {
      const expired = isExpired(item);
      if (status === "active" && (!item.is_active || expired)) return false;
      if (status === "disabled" && item.is_active) return false;
      if (expiration === "never" && item.expires_at) return false;
      if (expiration === "valid" && (!item.expires_at || expired)) return false;
      if (expiration === "expired" && !expired) return false;
      if (!keyword) return true;
      const candidate = searchField === "name" ? item.name : item.access_key;
      return candidate.toLowerCase().includes(keyword);
    });
  }, [apiKeys.data?.items, expiration, searchField, searchText, status]);
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const columns: Array<ListColumn<ApiKeyRecord>> = [
    {
      key: "name",
      title: "名称",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      key: "access_key",
      title: "Access Key",
      width: 180,
      ellipsis: true,
      dataIndex: "access_key",
    },
    {
      key: "status",
      title: "状态",
      width: 110,
      render: (_, item) =>
        isExpired(item) ? (
          <Tag color="gray">已过期</Tag>
        ) : item.is_active ? (
          <Tag color="green">启用</Tag>
        ) : (
          <Tag color="orange">已禁用</Tag>
        ),
    },
    {
      key: "scope",
      title: "角色",
      width: 140,
      dataIndex: "role_name",
      placeholder: "-",
      ellipsis: true,
    },
    {
      key: "expiresAt",
      title: "过期时间",
      width: 170,
      render: (_, item) => (item.expires_at ? formatDateTime(item.expires_at) : "永不过期"),
    },
    {
      key: "lastUsedAt",
      title: "最近使用",
      width: 170,
      render: (_, item) => formatDateTime(item.last_used_at),
    },
  ];

  const resetPage = () => setPage(1);
  const handleStatusChange = (nextStatus: StatusFilter) => {
    setStatus(nextStatus);
    resetPage();
  };
  const handleSearchFieldChange = (nextField: SearchField) => {
    setSearchField(nextField);
    resetPage();
  };
  const handleSearchTextChange = (value: string) => {
    setSearchText(value);
    resetPage();
  };

  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-Ukeyguanli",
          title: "API Key",
          subtitle: "管理用于 CLI、SDK 与签名调用的租户访问凭据",
          actions: [
            {
              key: "create",
              label: "创建 API Key",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: handleStatusChange,
          items: [
            { value: "all", label: "全部" },
            { value: "active", label: "启用" },
            { value: "disabled", label: "已禁用" },
          ],
        }}
        toolbar={{
          search: {
            fields: [
              { value: "name", label: "名称" },
              { value: "access_key", label: "Access Key" },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: handleSearchFieldChange,
            onChange: handleSearchTextChange,
          },
          filters: (
            <Select
              aria-label="按过期时间筛选"
              value={expiration}
              onChange={(value) => {
                setExpiration(value);
                resetPage();
              }}
              style={{ width: 160 }}
            >
              <Select.Option value="all">全部过期时间</Select.Option>
              <Select.Option value="never">永不过期</Select.Option>
              <Select.Option value="valid">未过期</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
            </Select>
          ),
          refresh: {
            label: "刷新",
            spinning: apiKeys.isFetching,
            onClick: () => apiKeys.refetch(),
          },
        }}
      >
        <ListDataTable
          data={pageItems}
          columns={columns}
          rowActions={[
            {
              key: "status",
              label: (item) => (item.is_active ? "禁用" : "启用"),
              widthLabel: "启用",
              intent: "warning",
              disabled: (item) => isExpired(item),
              tooltip: (item) => (isExpired(item) ? "已过期的 API Key 无法重新启用" : undefined),
              loading: (item) =>
                toggleStatus.isPending && toggleStatus.variables?.item.id === item.id,
              onClick: (item) => {
                if (!item.is_active) return toggleStatus.mutate({ item, active: true });
                Modal.confirm({
                  title: "禁用 API Key",
                  content: `确定禁用「${item.name}」？使用该 Key 的后续请求将立即失败。`,
                  okButtonProps: { status: "danger" },
                  onOk: () => toggleStatus.mutateAsync({ item, active: false }),
                });
              },
            },
            {
              key: "reset-secret",
              label: "重置",
              intent: "warning",
              loading: (item) => resetSecret.isPending && resetSecret.variables?.id === item.id,
              onClick: (item) => {
                Modal.confirm({
                  title: "重置 Secret Key",
                  content: `确定重置「${item.name}」的 Secret Key？旧 Secret Key 将立即失效。`,
                  okButtonProps: { status: "danger" },
                  onOk: () => resetSecret.mutateAsync(item),
                });
              },
            },
            {
              key: "delete",
              label: "删除",
              intent: "danger",
              loading: (item) => remove.isPending && remove.variables?.id === item.id,
              onClick: (item) => {
                Modal.confirm({
                  title: "删除 API Key",
                  content: `确定删除「${item.name}」？该操作不可恢复，相关调用将立即失效。`,
                  okButtonProps: { status: "danger" },
                  onOk: () => remove.mutateAsync(item),
                });
              },
            },
          ]}
          loading={apiKeys.isFetching}
          emptyText={
            searchText || status !== "all" || expiration !== "all"
              ? "没有符合条件的 API Key"
              : "还没有 API Key，创建后用于 CLI / SDK 调用"
          }
          tableLabel="API Key 列表"
          pagination={{
            page,
            pageSize,
            total: filteredItems.length,
            onPageChange: setPage,
            onPageSizeChange: (nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            },
          }}
        />
      </ListPageFrame>
      {createVisible && (
        <CreateApiKeyModal onCancel={() => setCreateVisible(false)} onCreated={setCredentials} />
      )}
      {credentials && (
        <ApiKeyCredentialsModal credentials={credentials} onCancel={() => setCredentials(null)} />
      )}
    </>
  );
}
