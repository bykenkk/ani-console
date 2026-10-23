import { Button } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listModelOperations, type ModelOperation } from "@/api/models";
import { DataTable, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type ModelOperationHistoryProps = { modelId: string };
const RESULT_LABELS = { accepted: "已受理", succeeded: "成功", failed: "失败" };

export default function ModelOperationHistory({ modelId }: ModelOperationHistoryProps) {
  const paging = useListPagination(modelId, 10);
  const { page, pageSize } = paging;
  const operations = useQuery({
    queryKey: ["governance-model-operations", modelId, { page, pageSize }],
    queryFn: ({ signal }) => listModelOperations(modelId, { page, pageSize }, signal),
    meta: {
      errorNotification: { id: withId("model-operations", modelId), action: "模型操作记录加载" },
    },
  });
  return (
    <DataTable<ModelOperation>
      header={{
        title: "模型操作记录",
        extra: (
          <Button loading={operations.isFetching} onClick={() => operations.refetch()}>
            刷新
          </Button>
        ),
      }}
      data={operations.data?.items ?? []}
      loading={operations.isFetching}
      columns={[
        { title: "操作类型", dataIndex: "action", width: 160 },
        { title: "操作时间", width: 180, render: (_, item) => formatDateTime(item.created_at) },
        { title: "操作人", dataIndex: "actor", width: 200, ellipsis: true },
        {
          title: "执行结果",
          width: 120,
          render: (_, item) => (
            <StatusBadge status={item.result}>
              {RESULT_LABELS[item.result] ?? item.result}
            </StatusBadge>
          ),
        },
        { title: "操作前状态", dataIndex: "before_state", width: 140 },
        { title: "操作后状态", dataIndex: "after_state", width: 140 },
        { title: "错误类型", dataIndex: "error_class", width: 180, ellipsis: true },
        { title: "模型版本 ID", dataIndex: "model_version_id", width: 240, ellipsis: true },
        { title: "任务 ID", dataIndex: "task_id", width: 240, ellipsis: true },
        { title: "请求 ID", dataIndex: "request_id", width: 240, ellipsis: true },
      ]}
      pagination={{
        mode: "total",
        page,
        pageSize,
        total: Number(operations.data?.total ?? 0),
        disabled: operations.isFetching,
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
      tableLabel="模型操作记录列表"
    />
  );
}
