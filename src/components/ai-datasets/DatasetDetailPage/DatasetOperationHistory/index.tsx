import { Button } from "@arco-design/web-react";
import { IconRefresh } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import { listDatasetOperations, type DatasetOperation } from "@/api/modeldev";
import { DataTable, StatusBadge } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { DATASET_OPERATION_LABELS, DATASET_OPERATION_RESULT_LABELS } from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type DatasetOperationHistoryProps = { datasetId: string };

export default function DatasetOperationHistory({ datasetId }: DatasetOperationHistoryProps) {
  const paging = useListPagination(datasetId, 20);
  const params = { page: paging.page, pageSize: paging.pageSize };
  const history = useQuery({
    queryKey: ["dataset-operations", datasetId, params],
    queryFn: ({ signal }) => listDatasetOperations(datasetId, params, signal),
    meta: {
      errorNotification: {
        id: withId("dataset-operations", datasetId),
        action: "数据集操作历史加载",
      },
    },
  });
  return (
    <DataTable<DatasetOperation>
      header={{
        extra: (
          <Button
            icon={<IconRefresh />}
            aria-label="刷新操作历史"
            title="刷新操作历史"
            loading={history.isFetching}
            onClick={() => history.refetch()}
          />
        ),
      }}
      rowKey="operation_id"
      data={history.data?.items ?? []}
      loading={history.isFetching}
      tableLabel="数据集操作历史列表"
      columns={[
        {
          title: "操作类型",
          width: 170,
          render: (_, item) => DATASET_OPERATION_LABELS[item.event_type] ?? item.event_type,
        },
        { title: "操作人", dataIndex: "actor", width: 200, ellipsis: true },
        { title: "操作时间", width: 180, render: (_, item) => formatDateTime(item.occurred_at) },
        {
          title: "操作结果",
          width: 120,
          render: (_, item) => (
            <StatusBadge status={item.result} loading={false}>
              {DATASET_OPERATION_RESULT_LABELS[item.result] ?? item.result}
            </StatusBadge>
          ),
        },
        { title: "错误码", dataIndex: "failure_code", width: 200, ellipsis: true },
        { title: "导入任务 ID", dataIndex: "import_task_id", width: 260, ellipsis: true },
        { title: "回执 ID", dataIndex: "receipt_id", width: 260, ellipsis: true },
        { title: "操作 ID", dataIndex: "operation_id", width: 260, ellipsis: true },
      ]}
      pagination={{
        mode: "total",
        page: paging.page,
        pageSize: paging.pageSize,
        total: Number(history.data?.total ?? 0),
        disabled: history.isFetching,
        onPageChange: paging.setPage,
        onPageSizeChange: paging.setPageSize,
      }}
    />
  );
}
