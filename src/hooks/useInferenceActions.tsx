import { Modal } from "@arco-design/web-react";
// FIXME(governance-migration): governance 当前未开放旧启停、重启及调整副本接口，不能将新资源 ID 交给 legacy 写接口。
// TODO(governance-migration): 新后端提供对应命令与操作状态契约后恢复这些入口，沿用异步受理与完成分离的反馈。
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deleteInferenceService,
  type InferenceService,
  type InferenceAcceptance,
} from "@/api/inference";
import type { RowAction } from "@/components/common";
import InferenceOperationModal from "@/components/ai-inference/InferenceOperationModal";

export function useInferenceActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const [acceptance, setAcceptance] = useState<InferenceAcceptance>();
  const remove = useMutation({
    mutationFn: (item: InferenceService) =>
      deleteInferenceService(item.id, item.gpu ? {} : { expected_generation: item.generation }),
    meta: {
      feedback: {
        channel: "notification",
        id: "inference-delete",
        action: "删除推理服务",
        successText: "删除推理服务已提交",
        errorFallback: "删除失败",
      },
    },
    onSuccess: async (result, item) => {
      setAcceptance(result);
      await qc.invalidateQueries({
        queryKey: ["governance-inference-service", item.id],
        refetchType: "none",
      });
      await qc.invalidateQueries({ queryKey: ["governance-inference-services"] });
    },
  });
  const actions: RowAction<InferenceService>[] = [
    ...["启动", "停止", "重启", "调整副本"].map((label) => ({
      key: label,
      label,
      disabled: () => true,
      tooltip: "当前后端尚未开放此操作",
      onClick: () => undefined,
    })),
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: () => remove.isPending || Boolean(acceptance),
      onClick: (item) => {
        Modal.confirm({
          title: "删除推理服务",
          content: `确定删除「${item.name}」？服务将异步停止并清理。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(item),
        });
      },
    },
  ];
  const dialogNode = acceptance ? (
    <InferenceOperationModal
      acceptance={acceptance}
      deleting
      onCancel={() => {
        setAcceptance(undefined);
        onDeleted?.();
      }}
    />
  ) : null;
  return { actions, dialogNode, deletionSubmitted: Boolean(acceptance) };
}
