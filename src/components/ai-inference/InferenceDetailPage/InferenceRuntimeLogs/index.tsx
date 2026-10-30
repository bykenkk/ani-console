import { Button, Select } from "@arco-design/web-react";
import { IconPlayArrowFill, IconRecordStop, IconRefresh } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getInferenceLogs, getInferenceRuntime, type InferenceLogLevel } from "@/api/inference";
import LogViewer from "@/components/common/LogViewer";
import { withId } from "@/lib/id";
import { formatInferenceLogs } from "./log-text";
import { useInferenceLogStream, INFERENCE_LOG_LIMIT } from "./useInferenceLogStream";

type InferenceRuntimeLogsProps = { serviceId: string };

export default function InferenceRuntimeLogs({ serviceId }: InferenceRuntimeLogsProps) {
  const [instance, setInstance] = useState("");
  const [container, setContainer] = useState("");
  const [level, setLevel] = useState<InferenceLogLevel>();
  const [live, setLive] = useState(false);
  const runtime = useQuery({
    queryKey: ["governance-inference-runtime", serviceId],
    queryFn: ({ signal }) => getInferenceRuntime(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-runtime", serviceId), action: "推理运行诊断加载" },
    },
  });
  const instances = runtime.data?.instances ?? [];
  const selectedInstance = instances.find((item) => item.name === instance) ?? instances[0];
  const containers = selectedInstance?.containers ?? [];
  const selectedContainer = containers.includes(container)
    ? container
    : containers.length === 1
      ? containers[0]
      : undefined;
  // 下游要求指定实例；多容器实例还必须明确容器，选择完整后才允许请求。
  const canQueryLogs = Boolean(
    selectedInstance && selectedContainer && containers.includes(selectedContainer),
  );
  const params = {
    level,
    instance: selectedInstance?.name,
    container: selectedContainer,
    tail_lines: INFERENCE_LOG_LIMIT,
  };
  const { lines, status: streamStatus } = useInferenceLogStream({
    serviceId,
    params,
    enabled: live && canQueryLogs,
  });
  const logs = useQuery({
    queryKey: ["governance-inference-logs", serviceId, params],
    enabled: !live && canQueryLogs,
    queryFn: ({ signal }) => getInferenceLogs(serviceId, params, signal),
    meta: {
      errorNotification: { id: withId("inference-logs", serviceId), action: "推理日志加载" },
    },
  });
  const text = useMemo(
    () => (canQueryLogs ? formatInferenceLogs(live ? lines : (logs.data?.items ?? [])) : ""),
    [canQueryLogs, live, lines, logs.data?.items],
  );
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Select
            aria-label="日志级别"
            placeholder="全部级别"
            allowClear
            size="small"
            value={level}
            disabled={live}
            autoWidth={false}
            style={{ width: 128 }}
            options={["trace", "debug", "info", "warn", "error", "fatal", "unknown"].map(
              (value) => ({
                value,
                label: value,
              }),
            )}
            onChange={setLevel}
          />
          <Select
            aria-label="日志实例"
            placeholder="请选择实例"
            size="small"
            value={selectedInstance?.name}
            disabled={live}
            autoWidth={false}
            style={{ width: 200 }}
            loading={runtime.isFetching}
            options={instances.map((item) => ({ value: item.name, label: item.name }))}
            onChange={(value: string | undefined) => {
              setInstance(value ?? "");
              setContainer("");
            }}
          />
          <Select
            aria-label="日志容器"
            placeholder="请选择容器"
            allowClear
            size="small"
            value={selectedContainer}
            disabled={live || !selectedInstance}
            autoWidth={false}
            style={{ width: 200 }}
            options={containers.map((name) => ({ value: name, label: name }))}
            onChange={(value: string | undefined) => setContainer(value ?? "")}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="small"
            icon={live ? <IconRecordStop /> : <IconPlayArrowFill />}
            aria-label={live ? "停止流式日志" : "开启流式日志"}
            title={live ? "停止流式日志" : "开启流式日志"}
            disabled={!live && !canQueryLogs}
            onClick={() => setLive((current) => !current)}
          />
          <Button
            size="small"
            icon={<IconRefresh />}
            aria-label="刷新日志"
            title="刷新日志"
            disabled={live || !canQueryLogs}
            loading={!live && logs.isFetching}
            onClick={() => logs.refetch()}
          />
        </div>
      </div>
      <LogViewer
        key={JSON.stringify([serviceId, selectedInstance?.name, selectedContainer, level, live])}
        className="flex-1"
        text={text}
        loading={canQueryLogs && (live ? streamStatus === "connecting" : logs.isFetching)}
        emptyDescription={
          !canQueryLogs
            ? "请选择实例和容器"
            : live && streamStatus === "connected"
              ? "等待新日志"
              : "暂无日志"
        }
        ariaLabel="推理日志"
      />
    </div>
  );
}
