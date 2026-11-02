import { Button, Empty } from "@arco-design/web-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listModelDevExecutionArtifacts, type ModelDevArtifact } from "@/api/modeldev";
import { DataTable } from "@/components/common";
import { useListPagination } from "@/hooks/useListPagination";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/date";
import ModelDevArtifactDownload from "./ModelDevArtifactDownload";

type ModelDevExecutionArtifactsProps = { executionId: string; deliveryState: string };

export default function ModelDevExecutionArtifacts({
  executionId,
  deliveryState,
}: ModelDevExecutionArtifactsProps) {
  const qc = useQueryClient();
  const paging = useListPagination(executionId, 10);
  const { page, pageSize } = paging;
  const query = useQuery({
    enabled: deliveryState === "PUBLISHED",
    queryKey: ["training-artifacts", executionId, { page, pageSize }],
    queryFn: ({ signal }) =>
      listModelDevExecutionArtifacts(executionId, { page, pageSize }, signal),
    meta: {
      errorNotification: {
        id: withId("training-artifacts", executionId),
        action: "训练产物加载",
        fallback: "请稍后重试",
      },
    },
  });
  const refresh = () => {
    paging.resetPagination();
    qc.invalidateQueries({ queryKey: ["training-artifacts", executionId] });
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
  if (deliveryState !== "PUBLISHED") return <Empty description="暂无已发布产物" />;
  return (
    <>
      <Button className="mb-4" loading={query.isRefetching} onClick={refresh}>
        刷新产物
      </Button>
      <DataTable<ModelDevArtifact>
        rowKey="artifact_id"
        data={query.data?.items ?? []}
        loading={query.isFetching}
        pagination={pagination}
        columns={[
          { title: "文件名", dataIndex: "filename", width: 200, ellipsis: true },
          { title: "类型", dataIndex: "role", width: 160, ellipsis: true },
          { title: "大小（字节）", dataIndex: "size_bytes", width: 150 },
          { title: "校验时间", dataIndex: "verified_at", width: 180, render: formatDateTime },
          {
            title: "操作",
            width: 100,
            render: (_, row) => <ModelDevArtifactDownload artifact={row} />,
          },
        ]}
      />
    </>
  );
}
