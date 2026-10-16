// FIXME(governance-migration): 收藏、删除未有对应公开模型契约；新增版本的文件上传链路未确认，相关入口保持禁用。
// TODO(governance-migration): 分别核对收藏/删除契约及版本元数据创建与文件上传流程，部署可用后恢复操作。
import { useState } from "react";
import CreateInferenceModal from "@/components/ai-inference/CreateInferenceModal";
import InferenceOperationModal from "@/components/ai-inference/InferenceOperationModal";
import type { InferenceAcceptance } from "@/api/inference";
import type { Model } from "@/api/models";
import type { RowAction } from "@/components/common";

export function useModelActions() {
  const [deployModel, setDeployModel] = useState<Model | null>(null);
  const [acceptance, setAcceptance] = useState<InferenceAcceptance>();
  const actions: RowAction<Model>[] = [
    {
      key: "deploy",
      label: "部署",
      disabled: (item) => item.status !== "ready" || !item.versions?.length,
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
      disabled: () => true,
      tooltip: "模型删除暂未开放",
      onClick: () => undefined,
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
