import { useResourceDelete } from "@/hooks/useResourceDelete";
// TODO(feature-visibility): 待知识库管理支持后恢复问答导航依赖。
// import { useNavigate } from "@tanstack/react-router";
import { type KnowledgeBase } from "@/api/knowledge";
// import { navigateToResourceDetail } from "@/lib/resources";
import type { RowAction } from "@/components/common";

export function useKnowledgeBaseActions(onDeleted: (item: KnowledgeBase) => void) {
  // TODO(feature-visibility): 待知识库管理支持后恢复问答导航。
  // const navigate = useNavigate();
  const remove = useResourceDelete<KnowledgeBase>("knowledge-base", onDeleted);

  const actions: RowAction<KnowledgeBase>[] = [
    // TODO(feature-visibility): 待知识库管理支持后恢复问答入口。
    // {
    //   key: "chat",
    //   label: "问答",
    //   onClick: (item) =>
    //     navigateToResourceDetail(navigate, {
    //       type: "knowledge-base",
    //       id: item.id,
    //       search: { tab: "chat" },
    //     }),
    // },
    {
      key: "delete",
      label: "删除",
      disabled: remove.isDisabled,
      loading: (item) => remove.isPending && remove.variables?.id === item.id,
      intent: "danger",
      onClick: (item) => {
        remove.confirm(item);
      },
    },
  ];
  return { actions };
}
