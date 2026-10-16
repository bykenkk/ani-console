// FIXME(modeldev-integration): 产物列表使用的公共分页 Hook 按页码推算 cursor，未将 next_cursor 原样用于下一页。
// TODO(modeldev-integration): 与训练任务列表一起核对并接入真实游标链，避免翻页遗漏或重复产物。
import { Button } from "@arco-design/web-react";
import { listModelDevExecutionArtifacts, type ModelDevArtifact } from "@/api/modeldev";
import { DataTable } from "@/components/common";
import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/date";
import TrainingArtifactDownload from "./TrainingArtifactDownload";

export default function TrainingTaskArtifacts({ executionId }: { executionId: string }) {
  const { query, pagination, refresh } = useCursorPaginatedQuery({
    queryKey: ["training-artifacts", executionId],
    errorNotification: {
      id: withId("training-artifacts", executionId),
      action: "训练产物加载",
      fallback: "请稍后重试",
    },
    queryFn: (params, signal) => listModelDevExecutionArtifacts(executionId, params, signal),
  });
  return (
    <>
      <Button className="mb-4" loading={query.isFetching} onClick={refresh}>
        刷新产物
      </Button>
      <DataTable<ModelDevArtifact>
        rowKey="artifact_id"
        data={query.data?.items ?? []}
        loading={query.isFetching}
        pagination={pagination}
        columns={[
          { title: "文件名", dataIndex: "filename", width: 220, ellipsis: true },
          { title: "类型", dataIndex: "role", width: 160, ellipsis: true },
          { title: "大小（字节）", dataIndex: "size_bytes", width: 150, placeholder: "-" },
          { title: "校验时间", dataIndex: "verified_at", width: 180, render: formatDateTime },
          {
            title: "操作",
            width: 100,
            render: (_, row) => <TrainingArtifactDownload artifact={row} />,
          },
        ]}
      />
    </>
  );
}
