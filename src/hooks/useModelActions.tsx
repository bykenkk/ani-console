// FIXME(governance-migration): 收藏和新增版本的公开契约仍未接入，相关入口保持禁用。
import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import CreateInferenceModal from "@/components/ai-inference/CreateInferenceModal";
import InferenceOperationModal from "@/components/ai-inference/InferenceOperationModal";
import type { InferenceAcceptance } from "@/api/inference";
import { deleteModel, type Model } from "@/api/models";
import type { RowAction } from "@/components/common";

export function useModelActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const [deployModel, setDeployModel] = useState<Model | null>(null);
  const [acceptance, setAcceptance] = useState<InferenceAcceptance>();
  const remove = useMutation({
    mutationFn: (item: Model) => deleteModel(item.id),
    meta: {
      feedback: {
        channel: "notification",
        id: "model-delete",
        action: "删除模型",
        successText: "模型已删除",
        errorFallback: "删除模型失败",
      },
    },
    onSuccess: async (_, item) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-models"] }),
        qc.invalidateQueries({
          queryKey: ["governance-model", item.id],
          refetchType: "none",
        }),
      ]);
      onDeleted?.();
    },
  });
  const actions: RowAction<Model>[] = [
    {
      key: "deploy",
      label: "部署",
      disabled: (item) =>
        !item.versions?.some((version) => version.status.toLowerCase() === "ready"),
      onClick: setDeployModel,
    },
    {
      key: "favorite",
      label: "收藏",
      disabled: () => true,
      tooltip: "等待后端开放收藏状态与操作接口",
      onClick: () => undefined,
    },
    {
      key: "add-version",
      label: "新增版本",
      disabled: () => true,
      tooltip: "等待后端确认测试环境的版本文件上传接口",
      onClick: () => undefined,
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      loading: (item) => remove.isPending && remove.variables?.id === item.id,
      onClick: (item) => {
        Modal.confirm({
          title: "删除模型",
          content: `确定删除「${item.name}」？删除后模型及其版本将不再出现在列表中。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(item),
        });
      },
    },
  ];
  const dialogNode = (
    <>
      {deployModel && (
        <CreateInferenceModal
          initialServiceName={("infer-" + deployModel.name).slice(0, 63)}
          initialModelId={deployModel.id}
          onCreated={setAcceptance}
          onCancel={() => setDeployModel(null)}
        />
      )}
      {acceptance && (
        <InferenceOperationModal
          acceptance={acceptance}
          onCancel={() => setAcceptance(undefined)}
        />
      )}
    </>
  );
  return { actions, dialogNode };
}
