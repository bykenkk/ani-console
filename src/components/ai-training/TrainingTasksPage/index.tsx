import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listModelDevExecutions, type ModelDevExecution } from "@/api/modeldev";
import { ListDataTable, ListPageFrame } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { taskColumns } from "./task-config";
import TrainingTaskCreateModal from "./TrainingTaskCreateModal";

const filters = { kind: "GENERAL_TRAINING" } as const;

export default function TrainingTasksPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const qc = useQueryClient();
  const paging = useListPagination(JSON.stringify(filters), 10);
  const { page, pageSize } = paging;
  const query = useQuery({
    queryKey: ["training-executions", filters, { page, pageSize }],
    queryFn: ({ signal }) => listModelDevExecutions({ ...filters, page, pageSize }, signal),
    // TODO(training-list): 待联调验证 kind=GENERAL_TRAINING 的筛选、total、空结果与超界页行为；名称与状态筛选暂缓恢复。
    meta: {
      errorNotification: {
        id: "training-executions",
        action: "训练任务加载",
        fallback: "请稍后重试",
      },
    },
  });
  const refresh = () => {
    paging.resetPagination();
    qc.invalidateQueries({ queryKey: ["training-executions"] });
  };
  const pagination = {
    mode: "total" as const,
    page,
    pageSize,
    total: Number(query.data?.total ?? 0),
    disabled: query.isFetching,
    onPageChange: paging.setPage,
    onPageSizeChange: paging.setPageSize,
  };
  const actions = useTrainingTaskActions();
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-moxing",
          title: "训练任务",
          subtitle: "查看普通训练任务的执行状态、训练日志与产物。",
          actions: [
            {
              key: "create",
              label: "创建训练任务",
              iconClassName: "icon-add-1",
              variant: "primary",
              onClick: () => setCreateVisible(true),
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
          columns={taskColumns()}
          loading={query.isFetching}
          pagination={pagination}
          tableLabel="训练任务列表"
          rowActions={actions}
        />
      </ListPageFrame>
      {createVisible && (
        <TrainingTaskCreateModal onCancel={() => setCreateVisible(false)} onCreated={refresh} />
      )}
    </>
  );
}
