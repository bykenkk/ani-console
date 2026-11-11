import { createElement } from "react";
import { ResourceIdentity, type ListColumn } from "@/components/common";
import type { ModelDevExecution } from "@/api/modeldev";
import { formatDateTime } from "@/lib/date";
import { formatModelDevComputeResources, formatModelDevExecutionDuration } from "@/lib/modeldev";
import ModelDevExecutionStatus from "@/components/modeldev/ModelDevExecutionStatus";

export function taskColumns(): ListColumn<ModelDevExecution>[] {
  return [
    {
      key: "name",
      title: "名称 / ID",
      width: 200,
      fixed: "left",
      render: (_, task) =>
        createElement(ResourceIdentity, {
          name: task.name,
          id: task.execution_id,
          type: "training-task",
        }),
    },
    {
      key: "status",
      title: "任务状态",
      width: 120,
      render: (_, task) => createElement(ModelDevExecutionStatus, { task }),
    },
    {
      key: "implementation",
      title: "训练实现",
      dataIndex: "implementation_id",
      width: 200,
      ellipsis: true,
    },
    {
      key: "datasetVersion",
      title: "数据集版本 ID",
      dataIndex: "input_version_id",
      width: 200,
      ellipsis: true,
    },
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
  ];
}
