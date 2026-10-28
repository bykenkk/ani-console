import { createElement } from "react";
import { ResourceNameId, type ListColumn } from "@/components/common";
import type { ModelDevExecution } from "@/api/modeldev";
import { formatDateTime } from "@/lib/date";
import { formatModelDevComputeResources, formatModelDevExecutionDuration } from "@/lib/modeldev";

export function taskColumns(): ListColumn<ModelDevExecution>[] {
  return [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, task) =>
        createElement(ResourceNameId, {
          name: task.name,
          id: task.execution_id,
          type: "training-task",
        }),
    },
    ...(
      [
        ["compute_state", "任务状态"],
        ["delivery_state", "发布状态"],
        ["close_state", "关闭状态"],
        ["resource_state", "资源状态"],
      ] as const
    ).map(([key, title]) => ({
      key,
      title,
      dataIndex: key,
      width: 120,
      ellipsis: true,
    })),
    { title: "当前步骤", dataIndex: "current_step", width: 140, ellipsis: true },
    {
      key: "resources",
      title: "资源配置",
      width: 240,
      ellipsis: true,
      render: (_, task) => formatModelDevComputeResources(task.compute),
    },
    { title: "创建时间", dataIndex: "accepted_at", width: 180, render: formatDateTime },
    {
      key: "duration",
      title: "运行时长",
      width: 180,
      ellipsis: true,
      render: (_, task) => formatModelDevExecutionDuration(task),
    },
    { title: "截止时间", dataIndex: "deadline_at", width: 180, render: formatDateTime },
  ];
}
