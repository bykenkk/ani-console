import { useQuery } from "@tanstack/react-query";
import { Empty } from "@arco-design/web-react";
import { getModelDevExecution } from "@/api/modeldev";
import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { withId } from "@/lib/id";
import TrainingTaskLogs from "./TrainingTaskLogs";
import TrainingTaskArtifacts from "./TrainingTaskArtifacts";
import TrainingExecutionSnapshot from "./TrainingExecutionSnapshot";
import TrainingTaskPipeline from "./TrainingTaskPipeline";
import TrainingTaskMetrics from "./TrainingTaskMetrics";
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
    refetchInterval: (query) =>
      query.state.status !== "error" &&
      query.state.data &&
      shouldObserveModelDevExecution(query.state.data)
        ? 5000
        : false,
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
            { label: "ID", value: <ResourceId value={task.execution_id} /> },
            { label: "计算状态", value: task.compute_state || "-" },
            { label: "发布状态", value: task.delivery_state || "-" },
            { label: "关闭状态", value: task.close_state || "-" },
            { label: "资源状态", value: task.resource_state || "-" },
            { label: "任务类型", value: task.kind || "-" },
            { label: "训练实现", value: task.implementation_id || "-" },
            { label: "算力规格", value: <ResourceId value={task.compute_preset_id} /> },
            { label: "数据集版本", value: task.input_version_id || "-" },
            { label: "镜像版本", value: task.image_version_id || "-" },
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
          content: <TrainingTaskPipeline steps={task.steps} failure={task.failure} />,
        },
        {
          key: "metrics",
          label: "训练曲线",
          content: <TrainingTaskMetrics metrics={task.metrics} />,
        },
        {
          key: "logs",
          label: "日志",
          content: (
            <TrainingTaskLogs
              key={executionId}
              executionId={executionId}
              observing={!detail.isError && shouldObserveModelDevExecution(task)}
            />
          ),
        },
        {
          key: "snapshot",
          label: "配置与记录",
          content: <TrainingExecutionSnapshot task={task} />,
        },
        {
          key: "artifacts",
          label: "产物",
          content:
            task.delivery_state === "PUBLISHED" ? (
              <TrainingTaskArtifacts key={executionId} executionId={executionId} />
            ) : (
              <Empty description="暂无已发布产物" />
            ),
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
    />
  );
}
