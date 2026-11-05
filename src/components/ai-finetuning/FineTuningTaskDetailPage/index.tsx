import { useQuery } from "@tanstack/react-query";
import { getModelDevExecution } from "@/api/modeldev";
import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import ModelDevExecutionPipeline from "@/components/modeldev/ModelDevExecutionPipeline";
import ModelDevTrainingMetrics from "@/components/modeldev/ModelDevTrainingMetrics";
import ModelDevExecutionLogs from "@/components/modeldev/ModelDevExecutionLogs";
import ModelDevExecutionSnapshot from "@/components/modeldev/ModelDevExecutionSnapshot";
import ModelDevExecutionArtifacts from "@/components/modeldev/ModelDevExecutionArtifacts";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { formatDateTime } from "@/lib/date";
import { withId } from "@/lib/id";
import { formatModelDevExecutionDuration, shouldObserveModelDevExecution } from "@/lib/modeldev";

type FineTuningTaskDetailPageProps = {
  executionId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
};

export default function FineTuningTaskDetailPage({
  executionId,
  tab,
  onTabChange,
  onBack,
}: FineTuningTaskDetailPageProps) {
  const detail = useQuery({
    queryKey: ["training-execution", executionId],
    queryFn: ({ signal }) => getModelDevExecution(executionId, signal),
    meta: {
      errorNotification: {
        id: withId("training-execution", executionId),
        action: "微调任务详情加载",
        fallback: "请稍后重试",
      },
    },
  });
  const actions = useTrainingTaskActions();
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const task = detail.data;

  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/ai-finetuning"), { label: task.name }]}
      title={task.name}
      icon={<AliIcon name="moxing" size={28} />}
      headerItems={[]}
      onBack={onBack}
      actions={<ResourceActionMenu record={task} actions={actions} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={task.execution_id} /> },
            { label: "训练阶段", value: task.managed_settings?.stage || "-" },
            { label: "微调方法", value: task.managed_settings?.finetuning_type || "-" },
            {
              label: "微调实现",
              value: <ResourceId value={task.implementation_id} />,
            },
            { label: "算力规格", value: <ResourceId value={task.compute_preset_id} /> },
            {
              label: "数据集版本",
              value: <ResourceId value={task.input_version_id} />,
            },
            {
              label: "镜像版本",
              value: <ResourceId value={task.image_version_id} />,
            },
            { label: "当前阶段", value: task.current_step || "-" },
            { label: "停止已请求", value: task.stop_requested ? "是" : "否" },
            { label: "受理时间", value: formatDateTime(task.accepted_at) },
            { label: "运行时长", value: formatModelDevExecutionDuration(task) },
            { label: "截止时间", value: formatDateTime(task.deadline_at) },
            { label: "观测时间", value: formatDateTime(task.observed_at) },
          ],
        },
        {
          key: "base-model",
          title: "基座模型",
          fields: [
            {
              label: "模型 ID",
              value: <ResourceId value={task.base_model?.model_id} />,
            },
            {
              label: "版本 ID",
              value: <ResourceId value={task.base_model?.version_id} />,
            },
            { label: "模型族", value: task.base_model?.family || "-" },
            { label: "权重格式", value: task.base_model?.format || "-" },
          ],
        },
      ]}
      tabs={[
        {
          key: "pipeline",
          label: "流水线",
          content: <ModelDevExecutionPipeline steps={task.steps} failure={task.failure} />,
        },
        {
          key: "metrics",
          label: "训练曲线",
          content: <ModelDevTrainingMetrics metrics={task.metrics} />,
        },
        {
          key: "logs",
          label: "日志",
          fill: true,
          content: (
            <ModelDevExecutionLogs
              key={executionId}
              executionId={executionId}
              observing={!detail.isError && shouldObserveModelDevExecution(task)}
            />
          ),
        },
        {
          key: "snapshot",
          label: "配置与记录",
          content: <ModelDevExecutionSnapshot task={task} />,
        },
        {
          key: "artifacts",
          label: "产物",
          content: (
            <ModelDevExecutionArtifacts
              key={executionId}
              executionId={executionId}
              deliveryState={task.delivery_state}
            />
          ),
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
    />
  );
}
