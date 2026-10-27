import { useState } from "react";
import { Button, Empty, Select, Space, Spin, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getModelDevExecutionLogs } from "@/api/modeldev";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/date";

type TrainingTaskLogsProps = { executionId: string; observing: boolean };

export default function TrainingTaskLogs({ executionId, observing }: TrainingTaskLogsProps) {
  const [tailLines, setTailLines] = useState(200);
  const [maxBytes, setMaxBytes] = useState(16384);
  const logs = useQuery({
    queryKey: ["training-logs", executionId, { tailLines, maxBytes }],
    queryFn: ({ signal }) =>
      getModelDevExecutionLogs(executionId, { tail_lines: tailLines, max_bytes: maxBytes }, signal),
    refetchInterval: (query) => (observing && query.state.status !== "error" ? 5000 : false),
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
      <Space wrap>
        <Select
          aria-label="日志行数上限"
          value={tailLines}
          onChange={setTailLines}
          style={{ width: 140 }}
          options={[100, 200, 500, 1000].map((value) => ({ value, label: `最近 ${value} 行` }))}
        />
        <Select
          aria-label="日志字节上限"
          value={maxBytes}
          onChange={setMaxBytes}
          style={{ width: 140 }}
          options={[8192, 16384, 32768, 65536].map((value) => ({
            value,
            label: `最多 ${value / 1024} KiB`,
          }))}
        />
        <Button loading={logs.isFetching} onClick={() => logs.refetch()}>
          刷新日志
        </Button>
      </Space>
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
      <Typography.Text type="secondary">
        观测时间：{formatDateTime(logs.data?.observed_at)}
      </Typography.Text>
    </Space>
  );
}
