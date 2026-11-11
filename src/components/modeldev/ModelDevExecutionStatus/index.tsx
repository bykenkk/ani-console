import type { ModelDevExecution } from "@/api/modeldev";
import { StatusBadge, type StatusBadgeTone } from "@/components/common";
import { formatDateTime } from "@/lib/date";

type ModelDevExecutionStatusProps = {
  task: ModelDevExecution;
};

const COMPUTE_STATES: Record<string, { label: string; tone: StatusBadgeTone }> = {
  TRAINING: { label: "训练中", tone: "primary" },
  SUCCEEDED: { label: "训练完成", tone: "success" },
  FAILED: { label: "训练失败", tone: "danger" },
  CANCELED: { label: "已取消", tone: "neutral" },
};

export default function ModelDevExecutionStatus({ task }: ModelDevExecutionStatusProps) {
  const state = COMPUTE_STATES[task.compute_state];

  return (
    <StatusBadge
      status={task.compute_state}
      tone={state?.tone}
      reason={`计算状态：${task.compute_state || "-"}`}
      message={[
        `发布状态：${task.delivery_state || "-"}`,
        `关闭状态：${task.close_state || "-"}`,
        `资源状态：${task.resource_state || "-"}`,
        `截止时间：${formatDateTime(task.deadline_at)}`,
      ].join("\n")}
    >
      {state?.label ?? (task.compute_state || "-")}
    </StatusBadge>
  );
}
