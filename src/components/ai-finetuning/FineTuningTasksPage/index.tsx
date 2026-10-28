import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listModelDevExecutions, type ModelDevExecution } from "@/api/modeldev";
import { ListDataTable, ListPageFrame, ResourceNameId, type ListColumn } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { formatDateTime } from "@/lib/date";
import { formatModelDevComputeResources, formatModelDevExecutionDuration } from "@/lib/modeldev";
import CreateFineTuningModal from "../CreateFineTuningModal";

const filters = {};

const columns: ListColumn<ModelDevExecution>[] = [
  {
    key: "name",
    title: "名称 / ID",
    width: 200,
    fixed: "left",
    render: (_, task) => (
      <ResourceNameId name={task.name} id={task.execution_id} type="training-task" />
    ),
  },
  { key: "status", title: "任务状态", dataIndex: "compute_state", width: 120, ellipsis: true },
  {
    key: "baseModel",
    title: "基础模型",
    dataIndex: "base_model.family",
    width: 200,
    ellipsis: true,
  },
  // TODO(finetuning-framework): 接口尚未提供训练框架字段，待合同补齐后接入。
  { key: "framework", title: "训练框架", width: 160, ellipsis: true },
  {
    key: "stage",
    title: "训练阶段",
    dataIndex: "managed_settings.stage",
    width: 140,
    ellipsis: true,
  },
  {
    key: "method",
    title: "微调方法",
    dataIndex: "managed_settings.finetuning_type",
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
    // TODO(finetuning-list): 页面预览暂不传 kind；恢复 FINETUNING 筛选后联调验证 total、空结果与超界页语义。
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
        refresh: { onClick: refresh, spinning: query.isFetching, disabled: query.isFetching },
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
