import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listModelDevExecutions, type ModelDevExecution } from "@/api/modeldev";
import {
  ListDataTable,
  ListPageFrame,
  ResourceIdentity,
  type ListColumn,
} from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { formatDateTime } from "@/lib/date";
import { formatModelDevComputeResources, formatModelDevExecutionDuration } from "@/lib/modeldev";
import ModelDevExecutionStatus from "@/components/modeldev/ModelDevExecutionStatus";
import CreateFineTuningModal from "../CreateFineTuningModal";

const filters = { kind: "FINETUNING" } as const;

const FINETUNING_METHOD_LABELS: Record<string, string> = {
  lora: "LoRA",
  qlora: "QLoRA",
  full: "全参数",
};

const columns: ListColumn<ModelDevExecution>[] = [
  {
    key: "name",
    title: "名称 / ID",
    width: 200,
    fixed: "left",
    render: (_, task) => (
      <ResourceIdentity name={task.name} id={task.execution_id} type="finetuning-task" />
    ),
  },
  {
    key: "status",
    title: "任务状态",
    width: 120,
    render: (_, task) => <ModelDevExecutionStatus task={task} />,
  },
  {
    key: "baseModel",
    title: "基础模型 / 版本",
    width: 200,
    render: (_, task) => (
      <ResourceIdentity
        name={task.base_model?.model_id}
        id={task.base_model?.version_id}
        openable={false}
      />
    ),
  },
  {
    key: "stage",
    title: "训练目标",
    dataIndex: "managed_settings.stage",
    width: 140,
    ellipsis: true,
    render: (value) => value?.toUpperCase() || "-",
  },
  {
    key: "method",
    title: "参数更新方式",
    dataIndex: "managed_settings.finetuning_type",
    width: 140,
    ellipsis: true,
    render: (value) => FINETUNING_METHOD_LABELS[value] || value || "-",
  },
  {
    key: "datasetVersion",
    title: "数据集版本 ID",
    dataIndex: "input_version_id",
    width: 200,
    ellipsis: true,
  },
  {
    key: "currentStep",
    title: "当前步骤",
    dataIndex: "current_step",
    width: 140,
    ellipsis: true,
  },
  {
    key: "resources",
    title: "资源配置",
    width: 240,
    ellipsis: true,
    render: (_, task) => formatModelDevComputeResources(task.compute),
  },
  {
    key: "createdAt",
    title: "创建时间",
    dataIndex: "accepted_at",
    width: 180,
    render: formatDateTime,
  },
  {
    key: "duration",
    title: "运行时长",
    width: 180,
    ellipsis: true,
    render: (_, task) => formatModelDevExecutionDuration(task),
  },
];

export default function FineTuningTasksPage() {
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const paging = useListPagination(JSON.stringify(filters), 10);
  const { page, pageSize } = paging;
  const query = useQuery({
    queryKey: ["training-executions", filters, { page, pageSize }],
    queryFn: ({ signal }) => listModelDevExecutions({ ...filters, page, pageSize }, signal),
    meta: {
      errorNotification: {
        id: "finetuning-executions",
        action: "微调任务加载",
        fallback: "请稍后重试",
      },
    },
  });
  const refresh = () => {
    paging.resetPagination();
    qc.invalidateQueries({ queryKey: ["training-executions", filters] });
  };
  const actions = useTrainingTaskActions();

  return (
    <ListPageFrame
      header={{
        title: "模型微调",
        subtitle: "管理模型微调任务，查看任务状态与训练配置。",
        iconClassName: "icon-moxing",
        actions: [
          {
            key: "create",
            label: "创建微调任务",
            iconClassName: "icon-add-1",
            variant: "primary",
            onClick: () => setCreating(true),
          },
        ],
      }}
      toolbar={{
        refresh: { onClick: refresh, spinning: query.isRefetching, disabled: query.isFetching },
      }}
    >
      <ListDataTable<ModelDevExecution>
        data={query.data?.items ?? []}
        rowKey="execution_id"
        columns={columns}
        loading={query.isFetching}
        pagination={{
          mode: "total",
          page,
          pageSize,
          total: Number(query.data?.total ?? 0),
          disabled: query.isFetching,
          onPageChange: paging.setPage,
          onPageSizeChange: paging.setPageSize,
        }}
        tableLabel="模型微调任务列表"
        rowActions={actions}
      />
      {creating && <CreateFineTuningModal onCancel={() => setCreating(false)} />}
    </ListPageFrame>
  );
}
