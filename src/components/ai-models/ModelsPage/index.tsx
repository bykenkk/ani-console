import { useModelActions } from "@/hooks/useModelActions";

import { Select, Space, Tag } from "@arco-design/web-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useListPagination } from "@/hooks/useListPagination";
import type { ListPagination } from "@/components/common/DataTable";
import { listModels, type ModelCapability } from "@/api/models";

import ImportModelModal from "./ImportModelModal";
import {
  ResourceNameId,
  ListPageFrame,
  StatusBadge,
  type ListColumn,
  ListDataTable,
} from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { formatModelCapabilities, MODEL_SOURCE_LABELS, type Model } from "@/lib/ai-models";

type StatusFilter = "all" | "pending" | "available" | "importing" | "failed";
type SearchField = "name";
type SourceFilter = "all" | Model["source"];
type CapabilityFilter = "all" | ModelCapability;

function getApiStatus(status: StatusFilter) {
  if (status === "pending") return "pending" as const;
  if (status === "available") return "ready" as const;
  if (status === "importing") return "downloading" as const;
  if (status === "failed") return "error" as const;
  return undefined;
}

export default function ModelsPage() {
  const [importVisible, setImportVisible] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [capability, setCapability] = useState<CapabilityFilter>("all");
  const filters = {
    keyword: searchText.trim() || undefined,
    source: source === "all" ? undefined : source,
    capability: capability === "all" ? undefined : capability,
    status: getApiStatus(status),
  };
  const qc = useQueryClient();
  const paging = useListPagination(JSON.stringify(filters), 10);
  const { page, pageSize, resetPagination } = paging;
  const models = useQuery({
    queryKey: ["governance-models", filters, { page, pageSize }],
    queryFn: ({ signal }) => listModels({ ...filters, page, pageSize }, signal),
    meta: {
      errorNotification: { id: "models", action: "模型列表加载", fallback: "请求失败，请稍后重试" },
    },
  });
  const items = models.data?.items ?? [];
  const pagination: ListPagination = {
    mode: "total",
    page,
    pageSize,
    total: Number(models.data?.total ?? 0),
    disabled: models.isFetching,
    onPageChange: paging.setPage,
    onPageSizeChange: paging.setPageSize,
  };
  const refresh = () => {
    resetPagination();
    qc.invalidateQueries({ queryKey: ["governance-models"], refetchType: "none" });
    if (page === 1) models.refetch();
  };
  const { actions, dialogNode } = useModelActions(resetPagination);

  const columns: Array<ListColumn<Model>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => <ResourceNameId name={item.name} id={item.id} type="model" />,
    },
    {
      key: "status",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.status} />,
    },
    {
      key: "source",
      title: "来源",
      width: 140,
      render: (_, item) => MODEL_SOURCE_LABELS[item.source ?? ""] ?? item.source ?? "-",
    },
    {
      key: "capabilities",
      title: "能力",
      width: 180,
      render: (_, item) =>
        item.capabilities?.length ? (
          <Space size={4}>
            {item.capabilities.map((capability) => (
              <Tag key={capability}>{formatModelCapabilities([capability])}</Tag>
            ))}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      key: "updatedAt",
      title: "更新时间",
      width: 180,
      render: (_, item) => formatDateTime(item.updated_at),
    },
  ];

  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-moxing",
          title: "模型仓库",
          subtitle: "统一管理模型 Catalog、版本与部署入口",
          actions: [
            {
              key: "import",
              label: "导入模型",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setImportVisible(true),
            },
          ],
        }}
        tabs={{
          value: status,
          onChange: setStatus,
          items: [
            {
              value: "all",
              label: "全部",
            },
            {
              value: "pending",
              label: "等待中",
            },
            {
              value: "available",
              label: "可用",
            },
            {
              value: "importing",
              label: "导入中",
            },
            {
              value: "failed",
              label: "失败",
            },
          ],
        }}
        toolbar={{
          search: {
            fields: [
              {
                value: "name",
                label: "名称",
              },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          filters: (
            <Space>
              <Select
                value={source}
                onChange={setSource}
                className="w-35"
                options={[
                  {
                    value: "all",
                    label: "全部来源",
                  },
                  {
                    value: "huggingface",
                    label: "HuggingFace",
                  },
                  {
                    value: "modelscope",
                    label: "ModelScope",
                  },
                  {
                    value: "upload",
                    label: "本地上传",
                  },
                  {
                    value: "builtin",
                    label: "内置",
                  },
                ]}
              />
              <Select
                value={capability}
                onChange={setCapability}
                className="w-35"
                options={[
                  {
                    value: "all",
                    label: "全部任务",
                  },
                  {
                    value: "text-generation",
                    label: "文本生成",
                  },
                  {
                    value: "embedding",
                    label: "文本向量化",
                  },
                  {
                    value: "speech-to-text",
                    label: "语音识别",
                  },
                ]}
              />
            </Space>
          ),
          refresh: {
            label: "刷新",
            spinning: models.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={models.isFetching}
          tableLabel="模型仓库列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {importVisible && <ImportModelModal onCancel={() => setImportVisible(false)} />}
      {dialogNode}
    </>
  );
}
