import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVectorStoreKnowledgeBaseLink, type VectorStore } from "@/api/storage/vector-stores";
import { DataTable, type RowAction } from "@/components/common";
// TODO(feature-visibility): 待知识库管理支持后恢复关联知识库跳转及导航依赖。
// import { navigateToResourceDetail } from "@/lib/resources";
// import { Button, Link, Modal, Space } from "@arco-design/web-react";
import { Button, Modal, Space } from "@arco-design/web-react";

// import { useNavigate } from "@tanstack/react-router";

type VectorStoreRelatedResourcesProps = { store: VectorStore };

type RelatedResource = { id: string; type: "知识库"; name: string };

export default function VectorStoreRelatedResources({ store }: VectorStoreRelatedResourcesProps) {
  // TODO(feature-visibility): 待知识库管理支持后恢复关联知识库导航。
  // const navigate = useNavigate();

  const qc = useQueryClient();
  const unlink = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "vector-store-knowledge-base-unlink",
        action: "解除关联",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (store: VectorStore) => deleteVectorStoreKnowledgeBaseLink(store.id),
    onSuccess: (_, store) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["vector-store", store.id] }),
        qc.invalidateQueries({ queryKey: ["vector-stores"] }),
      ]),
  });
  const unlinkAction: RowAction<VectorStore> = {
    key: "unlink-knowledge-base",
    label: "解除关联",
    disabled: (item) => unlink.isPending || !item.knowledge_base_ref,
    loading: () => unlink.isPending,
    onClick: (item) => {
      if (unlink.isPending || !item.knowledge_base_ref) return;
      Modal.confirm({
        title: "解除知识库关联",
        content:
          "确定解除向量存储「" +
          item.name +
          "」与知识库「" +
          item.knowledge_base_ref.name +
          "」的关联？",
        onOk: () => unlink.mutateAsync(item),
      });
    },
  };

  const resources: RelatedResource[] = store.knowledge_base_ref
    ? [
        {
          id: store.knowledge_base_ref.id,
          type: "知识库",
          name: store.knowledge_base_ref.name,
        },
      ]
    : [];

  return (
    <Space direction="vertical" size={12} className="w-full">
      <section>
        <DataTable<RelatedResource>
          data={resources}
          rowKey="id"
          pagination={false}
          tableLabel="向量存储关联资源列表"
          columns={[
            { title: "类型", dataIndex: "type", width: 160 },
            {
              title: "名称",
              width: 200,
              // TODO(feature-visibility): 待知识库管理支持后恢复此链接，暂保留名称展示。
              // render: (_, resource) => (
              //   <Link
              //     onClick={() =>
              //       navigateToResourceDetail(navigate, {
              //         type: "knowledge-base",
              //         id: resource.id,
              //         search: { tab: "documents" },
              //       })
              //     }
              //   >
              //     {resource.name || resource.id}
              //   </Link>
              // ),
              render: (_, resource) => resource.name || resource.id,
            },
            {
              title: "操作",
              width: 160,
              render: () => (
                <Button
                  type="text"
                  size="small"
                  loading={unlinkAction.loading?.(store)}
                  onClick={() => unlinkAction.onClick(store)}
                  disabled={unlinkAction.disabled?.(store)}
                >
                  解除关联
                </Button>
              ),
            },
          ]}
        />
      </section>
    </Space>
  );
}
