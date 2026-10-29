import { streamInstanceLogs } from "@/api/instances";
import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Select, Space } from "@arco-design/web-react";
import { IconPlayArrowFill, IconRecordStop, IconRefresh } from "@arco-design/web-react/icon";
import LogViewer from "@/components/common/LogViewer";
import { closeNotification, showNotification } from "@/lib/feedback";
import { withId } from "@/lib/id";
import { normalizeLogText } from "@/lib/log-text";

type InstanceLogsProps = { instanceId?: string; active: boolean };
type StreamStatus = "idle" | "connecting" | "connected";
type StreamResult = { type: "done"; reason: string } | { type: "closed" };

const LEVEL_OPTIONS = [
  { label: "全部级别", value: "all" },
  { label: "debug", value: "debug" },
  { label: "info", value: "info" },
  { label: "warn", value: "warn" },
  { label: "error", value: "error" },
];
const LOG_LIMIT = 1000;
const TIMEOUT_RECONNECT_DELAY_MS = 500;

async function readLogStream(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  appendLog: (text: string) => void,
): Promise<StreamResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const cancel = () => {
    reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  const consumeFrame = (rawFrame: string): StreamResult | undefined => {
    let eventType = "message";
    const dataLines: string[] = [];
    for (const line of rawFrame.split(/\r?\n/)) {
      if (line.startsWith("event:")) eventType = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) return;
    const payload = dataLines.join("\n");
    if (eventType === "log") {
      const value = JSON.parse(payload) as { text?: unknown };
      if (typeof value.text !== "string") throw new Error("日志流返回了无法识别的文本数据");
      appendLog(value.text);
      return;
    }
    if (eventType === "error") {
      const error = JSON.parse(payload) as { message?: string; reason?: string };
      throw new Error(error.message || error.reason || "日志流发生错误");
    }
    if (eventType === "end") {
      const done = JSON.parse(payload) as { reason?: string };
      return { type: "done", reason: done.reason || "closed" };
    }
  };
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (signal.aborted) return { type: "closed" };
      if (done) throw new Error("日志流连接已断开，请重新连接");
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const result = consumeFrame(frame);
        if (result) return result;
      }
    }
    return { type: "closed" };
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function connectLogStream({
  instanceId,
  follow,
  signal,
  appendLog,
  onConnected,
}: {
  instanceId: string;
  follow: boolean;
  signal: AbortSignal;
  appendLog: (text: string) => void;
  onConnected: () => void;
}): Promise<StreamResult> {
  const data = await streamInstanceLogs(instanceId, { tailLines: LOG_LIMIT, follow }, signal);
  onConnected();
  return readLogStream(data, signal, appendLog);
}

export default function InstanceLogs({ instanceId, active }: InstanceLogsProps) {
  // TODO(instance-logs): 云主机、沙箱的新日志契约尚未提供，保留模板空态，待接口补齐后接入。
  // FIXME(governance-instance-logs): 当前协议只返回 text，级别筛选暂不可用。
  // TODO(governance-instance-logs): 结构化日志与级别筛选契约对齐并验证后启用；文本块不补造时间/级别，不去重。
  const [request, setRequest] = useState({ follow: false, version: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const streaming = request.follow && streamStatus !== "idle";
  const text = useMemo(() => normalizeLogText(logs.join("")), [logs]);
  useEffect(() => {
    if (!active || !instanceId) {
      setStreamStatus("idle");
      if (!instanceId) setLogs([]);
      return;
    }
    const id = instanceId;
    let cancelled = false;
    const controller = new AbortController();
    setLogs([]);
    const appendLog = (text: string) => {
      if (!cancelled) setLogs((current) => [...current, text]);
    };
    async function connect() {
      closeNotification(withId("instance-logs", id));
      while (!cancelled && !controller.signal.aborted) {
        setStreamStatus("connecting");
        try {
          const result = await connectLogStream({
            instanceId: id,
            follow: request.follow,
            signal: controller.signal,
            appendLog,
            onConnected: () => {
              if (!cancelled) {
                closeNotification(withId("instance-logs", id));
                setStreamStatus("connected");
              }
            },
          });
          if (!request.follow || result.type !== "done" || result.reason !== "timeout") {
            if (!cancelled) setStreamStatus("idle");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, TIMEOUT_RECONNECT_DELAY_MS));
        } catch (error) {
          if (!cancelled && !controller.signal.aborted) {
            setStreamStatus("idle");
            showNotification({
              id: withId("instance-logs", id),
              state: "error",
              action: "日志流连接",
              content: { error, fallback: "日志流连接失败" },
            });
          }
          return;
        }
      }
    }
    connect();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, instanceId, request]);
  if (!active) return <Empty description="打开日志 Tab 后连接日志流" />;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
      <Space wrap className="shrink-0">
        <Select
          aria-label="日志级别"
          placeholder="全部级别"
          size="small"
          autoWidth={false}
          style={{ width: 128 }}
        >
          {LEVEL_OPTIONS.map((item) => (
            <Select.Option key={item.value} value={item.value} disabled={item.value !== "all"}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
        <Button
          size="small"
          icon={streaming ? <IconRecordStop /> : <IconPlayArrowFill />}
          aria-label={streaming ? "停止流式日志" : "开启流式日志"}
          title={streaming ? "停止流式日志" : "开启流式日志"}
          disabled={!instanceId}
          onClick={() =>
            setRequest((current) => ({ follow: !streaming, version: current.version + 1 }))
          }
        />
        <Button
          size="small"
          icon={<IconRefresh />}
          aria-label="刷新日志"
          title="刷新日志"
          disabled={!instanceId || streaming}
          loading={!request.follow && streamStatus !== "idle"}
          onClick={() => setRequest((current) => ({ follow: false, version: current.version + 1 }))}
        />
      </Space>
      <LogViewer
        key={`${instanceId ?? ""}:${request.version}`}
        className="flex-1"
        text={text}
        loading={streamStatus === "connecting" || (!request.follow && streamStatus === "connected")}
        emptyDescription={streaming && streamStatus === "connected" ? "等待新日志" : "暂无日志"}
        ariaLabel="实例日志"
      />
    </div>
  );
}
