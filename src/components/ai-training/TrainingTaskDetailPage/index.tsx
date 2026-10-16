// FIXME(modeldev-integration): 详情没有刷新入口或持续状态观测，创建/停止后仅获取快照，产物区域也不会随后台发布自动更新。
// TODO(modeldev-integration): 对齐项目刷新约定与交接文档的轮询要求，补齐状态刷新，并按明确终态结束观测。
// FIXME(modeldev-integration): 当前仅展示 compute/delivery/close 三轴，接口的 resource_state 未展示。
// TODO(modeldev-integration): 补齐资源状态、停止意图及必要观测时间，不能用训练完成或停止受理代替 CLOSED/资源释放。
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

export default function TrainingTaskDetailPage({
  executionId,
  tab,
  onTabChange,
  onBack,
}: {
  executionId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
}) {
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
            { label: "ID", value: <ResourceId value={task.execution_id} /> },
            { label: "计算状态", value: task.compute_state || "-" },
            { label: "发布状态", value: task.delivery_state || "-" },
            { label: "关闭状态", value: task.close_state || "-" },
            { label: "训练预设", value: task.preset_id || "-" },
            { label: "发布版本", value: task.release_id || "-" },
            { label: "数据集版本", value: task.input_version_id || "-" },
            { label: "镜像版本", value: task.image_version_id || "-" },
          ],
        },
      ]}
      tabs={[
        {
          key: "logs",
          label: "日志",
          content:
            task.close_state === "CLOSED" ? (
              <Empty description="日志已不可用" />
            ) : (
              <TrainingTaskLogs key={executionId} executionId={executionId} />
            ),
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
