import { useVectorStoreActions } from "@/hooks/useVectorStoreActions";

// TODO(feature-visibility): 待知识库管理支持后恢复关联知识库跳转及导航依赖。
// import { useNavigate } from "@tanstack/react-router";
// import { Link } from "@arco-design/web-react";
import { useState } from "react";
import { listVectorStores, type VectorStore } from "@/api/storage/vector-stores";

import CreateVectorStoreModal from "@/components/vector-stores/CreateVectorStoreModal";
import {
  ResourceNameId,
  ListPageFrame,
  type ListColumn,
  StatusBadge,
  ListDataTable,
} from "@/components/common";
import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { formatDateTime } from "@/lib/format";
// import { navigateToResourceDetail } from "@/lib/resources";

type StatusFilter = "all" | "ready" | "pending" | "failed";
type SearchField = "name" | "id";

export default function VectorStoresPage() {
  // TODO(feature-visibility): 待知识库管理支持后恢复关联知识库导航。
  // const navigate = useNavigate();
  const [createVisible, setCreateVisible] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchField, setSearchField] = useState<SearchField>("name");
  const [searchText, setSearchText] = useState("");
  const {
    query: stores,
    resetPagination,
    refresh,
    items,
    pagination,
  } = useClientPaginatedQuery<VectorStore>({
    errorNotification: {
      id: "vector-stores",
      action: "向量存储列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["vector-stores", { status, searchField, searchText }],
    queryFn: async () => {
      const keyword = searchText.trim();
      return listVectorStores({
        state: status === "all" ? undefined : status,
        search_field: keyword ? searchField : undefined,
        keyword: keyword || undefined,
      });
    },
  });

  const { actions } = useVectorStoreActions(resetPagination);

  const columns: Array<ListColumn<VectorStore>> = [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, item) => (
        <ResourceNameId
          name={item.name}
          id={item.id}
          type="vector-store"
          search={{ tab: undefined }}
        />
      ),
    },
    {
      key: "state",
      title: "状态",
      width: 120,
      render: (_, item) => <StatusBadge status={item.state} />,
    },
    {
      key: "dimension",
      title: "维度",
      width: 100,
      dataIndex: "dimension",
    },
    {
      key: "metric",
      title: "度量",
      width: 120,
      render: (_, item) => item.metric.toUpperCase(),
    },
    {
      key: "embeddingModel",
      title: "向量化模型",
      width: 200,
      ellipsis: true,
      dataIndex: "embedding_model",
    },
    {
      key: "vectorCount",
      title: "向量数",
      width: 100,
      dataIndex: "vector_count",
    },
    {
      key: "knowledgeBase",
      title: "关联知识库",
      width: 200,
      ellipsis: true,
      render: (_, item) => {
        const knowledgeBase = item.knowledge_base_ref;
        // TODO(feature-visibility): 待知识库管理支持后恢复此链接，暂保留名称展示。
        // return knowledgeBase ? (
        //   <Link
        //     onClick={() =>
        //       navigateToResourceDetail(navigate, {
        //         type: "knowledge-base",
        //         id: knowledgeBase.id,
        //         search: { tab: "documents" },
        //       })
        //     }
        //   >
        //     {knowledgeBase.name || knowledgeBase.id}
        //   </Link>
        // ) : (
        //   "未关联"
        // );
        return knowledgeBase ? knowledgeBase.name || knowledgeBase.id : "未关联";
      },
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 180,
      render: (_, item) => formatDateTime(item.created_at),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-xiangliangcunchu",
          title: "向量存储",
          subtitle: "管理用于语义检索和 AI 应用的向量数据",
          actions: [
            {
              key: "create",
              label: "创建向量存储",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
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
              value: "ready",
              label: "可用",
            },
            {
              value: "pending",
              label: "创建中",
            },
            {
              value: "failed",
              label: "异常",
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
              {
                value: "id",
                label: "ID",
              },
            ],
            field: searchField,
            value: searchText,
            onFieldChange: setSearchField,
            onChange: setSearchText,
          },
          refresh: {
            label: "刷新",
            spinning: stores.isFetching,
            onClick: refresh,
          },
        }}
      >
        <ListDataTable
          data={items}
          columns={columns}
          rowActions={actions}
          loading={stores.isFetching}
          tableLabel="向量存储列表"
          pagination={pagination}
        />
      </ListPageFrame>
      {createVisible && <CreateVectorStoreModal onCancel={() => setCreateVisible(false)} />}
    </>
  );
}
