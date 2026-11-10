import { useQuery } from "@tanstack/react-query";
import { getModelDevExecution } from "@/api/modeldev";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceIdentity,
} from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { withId } from "@/lib/id";
import ModelDevExecutionLogs from "@/components/modeldev/ModelDevExecutionLogs";
import ModelDevExecutionArtifacts from "@/components/modeldev/ModelDevExecutionArtifacts";
import ModelDevExecutionSnapshot from "@/components/modeldev/ModelDevExecutionSnapshot";
import ModelDevExecutionPipeline from "@/components/modeldev/ModelDevExecutionPipeline";
import ModelDevTrainingMetrics from "@/components/modeldev/ModelDevTrainingMetrics";
import { formatDateTime } from "@/lib/date";
import { shouldObserveModelDevExecution } from "@/lib/modeldev";

type TrainingTaskDetailPageProps = {
  executionId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
};

export default function TrainingTaskDetailPage({
  executionId,
  tab,
  onTabChange,
  onBack,
}: TrainingTaskDetailPageProps) {
  const detail = useQuery({
    queryKey: ["training-execution", executionId],
    queryFn: ({ signal }) => getModelDevExecution(executionId, signal),
    meta: {
      errorNotification: {
        id: withId("training-execution", executionId),
        action: "训练任务详情加载",
        fallback: "请稍后重试",
      },
    },
  });
  const actions = useTrainingTaskActions();
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const task = detail.data;
  return (
    <DetailPageFrame
      breadcrumbs={[...navigationBreadcrumbsForPath("/ai-training"), { label: task.name }]}
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
            { label: "ID", value: <ResourceIdentity display="id" id={task.execution_id} /> },
            { label: "任务类型", value: task.kind || "-" },
            {
              label: "训练实现",
              value: <ResourceIdentity display="id" id={task.implementation_id} />,
            },
            {
              label: "算力规格",
              value: <ResourceIdentity display="id" id={task.compute_preset_id} />,
            },
            {
              label: "数据集版本",
              value: <ResourceIdentity display="id" id={task.input_version_id} />,
            },
            {
              label: "镜像版本",
              value: <ResourceIdentity display="id" id={task.image_version_id} />,
            },
            { label: "当前阶段", value: task.current_step || "-" },
            { label: "停止已请求", value: task.stop_requested ? "是" : "否" },
            { label: "受理时间", value: formatDateTime(task.accepted_at) },
            { label: "截止时间", value: formatDateTime(task.deadline_at) },
            { label: "观测时间", value: formatDateTime(task.observed_at) },
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
