import { useMemo, useState } from "react";
import { Button, Select, Space, Typography } from "@arco-design/web-react";
import { IconPlayArrowFill, IconRecordStop, IconRefresh } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import { getModelDevExecutionLogs } from "@/api/modeldev";
import LogViewer from "@/components/common/LogViewer";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/date";
import { normalizeLogText } from "@/lib/log-text";

type TrainingTaskLogsProps = { executionId: string; observing: boolean };

export default function TrainingTaskLogs({ executionId, observing }: TrainingTaskLogsProps) {
  const [tailLines, setTailLines] = useState(200);
  const [maxBytes, setMaxBytes] = useState(16384);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logs = useQuery({
    queryKey: ["training-logs", executionId, { tailLines, maxBytes }],
    queryFn: ({ signal }) =>
      getModelDevExecutionLogs(executionId, { tail_lines: tailLines, max_bytes: maxBytes }, signal),
    refetchInterval: (query) =>
      autoRefresh && observing && query.state.status !== "error" ? 5000 : false,
    meta: {
      errorNotification: {
        id: withId("training-logs", executionId),
        action: "训练日志加载",
        fallback: "请稍后重试",
      },
    },
  });
  const refreshing = autoRefresh && observing && !logs.isError;
  const text = useMemo(
    () =>
      normalizeLogText(
        (logs.data?.lines ?? [])
          .map(
            (line) =>
              `${line.timestamp ? `${formatDateTime(line.timestamp)} ` : ""}${line.text ?? ""}`,
          )
          .join("\n"),
      ),
    [logs.data?.lines],
  );
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
      <Space wrap className="shrink-0">
        <Select
          aria-label="日志行数上限"
          placeholder="请选择日志行数上限"
          size="small"
          autoWidth={false}
          value={tailLines}
          onChange={setTailLines}
          style={{ width: 200 }}
          options={[100, 200, 500, 1000].map((value) => ({ value, label: `最近 ${value} 行` }))}
        />
        <Select
          aria-label="日志字节上限"
          placeholder="请选择日志字节上限"
          size="small"
          autoWidth={false}
          value={maxBytes}
          onChange={setMaxBytes}
          style={{ width: 200 }}
          options={[8192, 16384, 32768, 65536].map((value) => ({
            value,
            label: `最多 ${value / 1024} KiB`,
          }))}
        />
        <Button
          size="small"
          icon={refreshing ? <IconRecordStop /> : <IconPlayArrowFill />}
          aria-label={refreshing ? "暂停自动刷新" : "开启自动刷新"}
          title={refreshing ? "暂停自动刷新" : "开启自动刷新"}
          disabled={!observing}
          onClick={() => {
            setAutoRefresh(!refreshing);
            if (!refreshing) logs.refetch();
          }}
        />
        <Button
          size="small"
          icon={<IconRefresh />}
          aria-label="刷新日志"
          title="刷新日志"
          disabled={refreshing}
          loading={logs.isFetching}
          onClick={() => logs.refetch()}
        />
      </Space>
      <LogViewer
        key={`${executionId}:${tailLines}:${maxBytes}`}
        className="flex-1"
        text={text}
        loading={logs.isFetching}
        emptyDescription="暂无日志"
        ariaLabel="训练日志"
      />
      {logs.data?.truncated && (
        <Typography.Text className="shrink-0" type="secondary">
          仅显示最近部分日志
        </Typography.Text>
      )}
    </div>
  );
}
