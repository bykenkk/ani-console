// FIXME(modeldev-integration): 当前只展示默认上限的 JSON 日志尾部，尚未提供 tail_lines/max_bytes 控制及观测时间。
// TODO(modeldev-integration): 核对日志保留与关闭语义后补齐必要控制；保持有界请求，不将此接口当作 SSE 或完整日志下载。
import { Button, Empty, Space, Spin, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getModelDevExecutionLogs } from "@/api/modeldev";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/date";

type TrainingTaskLogsProps = { executionId: string };

export default function TrainingTaskLogs({ executionId }: TrainingTaskLogsProps) {
  const logs = useQuery({
    queryKey: ["training-logs", executionId],
    queryFn: ({ signal }) => getModelDevExecutionLogs(executionId, {}, signal),
    meta: {
      errorNotification: {
        id: withId("training-logs", executionId),
        action: "训练日志加载",
        fallback: "请稍后重试",
      },
    },
  });
  return (
    <Space direction="vertical" className="w-full">
      <Button loading={logs.isFetching} onClick={() => logs.refetch()}>
        刷新日志
      </Button>
      <Spin loading={logs.isLoading} className="w-full">
        {logs.data?.lines?.length ? (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap wrap-break-word">
            {logs.data.lines
              .map(
                (line) =>
                  `${line.timestamp ? `${formatDateTime(line.timestamp)} ` : ""}${line.text ?? ""}`,
              )
              .join("\n")}
          </pre>
        ) : (
          <Empty description="暂无日志" />
        )}
      </Spin>
      {logs.data?.truncated && (
        <Typography.Text type="secondary">仅显示最近部分日志</Typography.Text>
      )}
    </Space>
  );
}
