// FIXME(modeldev-integration): 任务分页复用了按页码生成数字 cursor 的公共 Hook，尚未原样保存后端 next_cursor。
// TODO(modeldev-integration): 确认训练游标契约后改为服务端游标链；不能把不透明 token 当作 offset 计算。
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { listModelDevExecutions, type ModelDevExecution } from "@/api/modeldev";
import { ListDataTable, ListPageFrame } from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { useTrainingTaskActions } from "@/hooks/useTrainingTaskActions";
import { taskColumns } from "./task-config";
import TrainingTaskCreateModal from "./TrainingTaskCreateModal";

export default function TrainingTasksPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const navigate = useNavigate();
  const openDetail = (executionId: string) =>
    navigate({ to: "/ai-training/$executionId", params: { executionId } });
  const { query, pagination, refresh } = useCursorPaginatedQuery({
    queryKey: ["training-executions"],
    errorNotification: {
      id: "training-executions",
      action: "训练任务加载",
      fallback: "请稍后重试",
    },
    queryFn: listModelDevExecutions,
  });
  const actions = useTrainingTaskActions();
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-moxing",
          title: "训练任务",
          subtitle: "管理训练任务，查看执行状态、训练日志与产物。",
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
        <TrainingTaskCreateModal
          onCancel={() => setCreateVisible(false)}
          onCreated={(result) => {
            refresh();
            openDetail(result.execution_id);
          }}
        />
      )}
    </>
  );
}
