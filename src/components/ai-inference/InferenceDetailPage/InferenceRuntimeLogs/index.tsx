import {
  Alert,
  Button,
  Empty,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
} from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getInferenceLogs, getInferenceRuntime } from "@/api/inference";
import { getPreviousHoursDateTimeRange } from "@/lib/date";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { useInferenceLogStream, INFERENCE_LOG_LIMIT } from "./useInferenceLogStream";

type InferenceRuntimeLogsProps = { serviceId: string };

export default function InferenceRuntimeLogs({ serviceId }: InferenceRuntimeLogsProps) {
  const [instance, setInstance] = useState("");
  const [container, setContainer] = useState("");
  const [tailLines, setTailLines] = useState(INFERENCE_LOG_LIMIT);
  const [hours, setHours] = useState(0);
  const [since, setSince] = useState<string>();
  const [live, setLive] = useState(false);
  const [connection, setConnection] = useState(0);
  const params = {
    instance: instance || undefined,
    container: container || undefined,
    since,
    tail_lines: tailLines,
  };
  const { lines, status: streamStatus } = useInferenceLogStream({
    serviceId,
    params,
    enabled: live,
    connection,
  });
  const runtime = useQuery({
    queryKey: ["governance-inference-runtime", serviceId],
    queryFn: ({ signal }) => getInferenceRuntime(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-runtime", serviceId), action: "推理运行诊断加载" },
    },
  });
  const logs = useQuery({
    queryKey: ["governance-inference-logs", serviceId, params],
    enabled: !live,
    queryFn: ({ signal }) => getInferenceLogs(serviceId, params, signal),
    meta: {
      errorNotification: { id: withId("inference-logs", serviceId), action: "推理日志加载" },
    },
  });
  const instances = runtime.data?.instances ?? [];
  const containers = instances.find((item) => item.name === instance)?.containers ?? [];
  const displayed = live ? lines : (logs.data?.items ?? []);
  return (
    <div className="flex flex-col gap-3">
      <Space wrap>
        <Select
          aria-label="日志实例"
          placeholder="全部实例"
          allowClear
          value={instance || undefined}
          disabled={live}
          className="w-48"
          loading={runtime.isFetching}
          options={instances.map((item) => ({ value: item.name, label: item.name }))}
          onChange={(value: string | undefined) => {
            setInstance(value ?? "");
            setContainer("");
          }}
        />
        <Select
          aria-label="日志容器"
          placeholder="全部容器"
          allowClear
          value={container || undefined}
          disabled={live || !instance}
          className="w-40"
          options={containers.map((name) => ({ value: name, label: name }))}
          onChange={(value: string | undefined) => setContainer(value ?? "")}
        />
        <Select
          aria-label="日志时间范围"
          value={hours}
          disabled={live}
          className="w-32"
          options={[
            { value: 0, label: "全部时间" },
            { value: 1, label: "最近 1 小时" },
            { value: 24, label: "最近 24 小时" },
          ]}
          onChange={(value: number) => {
            setHours(value);
            setSince(value ? getPreviousHoursDateTimeRange(value).start : undefined);
          }}
        />
        <Typography.Text>末尾行数</Typography.Text>
        <InputNumber
          aria-label="末尾行数"
          value={tailLines}
          min={1}
          max={INFERENCE_LOG_LIMIT}
          precision={0}
          disabled={live}
          className="w-28"
          onChange={(value) => setTailLines(value ?? INFERENCE_LOG_LIMIT)}
        />
      </Space>
      <Space wrap>
        <Button
          loading={!live && logs.isFetching}
          onClick={() => {
            if (live) setLive(false);
            else logs.refetch();
          }}
        >
          查询日志
        </Button>
        <Button
          type="primary"
          loading={streamStatus === "connecting"}
          onClick={() => {
            setLive(true);
            setConnection((value) => value + 1);
          }}
        >
          {live ? "重新连接" : "实时日志"}
        </Button>
        <Button disabled={!live} onClick={() => setLive(false)}>
          停止实时日志
        </Button>
        <Typography.Text type="secondary">
          {live
            ? streamStatus === "connected"
              ? "实时日志已连接"
              : streamStatus === "connecting"
                ? "正在连接"
                : "连接已结束"
            : "日志快照"}
        </Typography.Text>
      </Space>
      {!live && logs.data?.truncated && (
        <Alert type="info" content="日志已截断，可缩小时间范围或选择具体实例查看" />
      )}
      <Spin loading={live ? streamStatus === "connecting" : logs.isFetching}>
        {displayed.length ? (
          <pre className="m-0 max-h-96 min-h-60 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-(--color-fill-2) p-3 font-mono text-xs leading-5">
            {displayed
              .map(
                (line) =>
                  `${line.timestamp ? `${formatDateTime(line.timestamp)} ` : ""}${line.message}`,
              )
              .join("\n")}
          </pre>
        ) : (
          <div className="flex min-h-60 items-center justify-center">
            <Empty description={live && streamStatus === "connected" ? "等待新日志" : "暂无日志"} />
          </div>
        )}
      </Spin>
      {live && (
        <Typography.Text type="secondary">仅保留最近 {INFERENCE_LOG_LIMIT} 行日志</Typography.Text>
      )}
      {/* TODO(inference-logs): 新协议没有日志级别字段及筛选，待正式契约补齐后再接入，不解析文本伪造级别。 */}
    </div>
  );
}
