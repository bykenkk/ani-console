import { streamInstanceLogs } from "@/api/instances";
import { useEffect, useRef, useState } from "react";
import { Button, Empty, Select, Space, Spin, Typography } from "@arco-design/web-react";
import { closeNotification, showNotification } from "@/lib/feedback";
import { withId } from "@/lib/id";

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
const AUTO_SCROLL_THRESHOLD_PX = 24;
const TIMEOUT_RECONNECT_DELAY_MS = 500;

async function readLogStream(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  appendLog: (text: string) => void,
): Promise<StreamResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
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
    reader.releaseLock();
  }
}

async function connectLogStream({
  instanceId,
  signal,
  appendLog,
  onConnected,
}: {
  instanceId: string;
  signal: AbortSignal;
  appendLog: (text: string) => void;
  onConnected: () => void;
}): Promise<StreamResult> {
  const data = await streamInstanceLogs(instanceId, { tailLines: LOG_LIMIT, follow: true }, signal);
  onConnected();
  return readLogStream(data, signal, appendLog);
}

export default function InstanceLogs({ instanceId, active }: InstanceLogsProps) {
  // TODO(instance-detail-migration): 云主机、沙箱日志契约和实例 ID 对齐并联调验证后，在调用方传入 ID，再移除对应标记。
  // FIXME(governance-instance-logs): 当前协议只返回 text，级别筛选暂不可用。
  // TODO(governance-instance-logs): 结构化日志与级别筛选契约对齐并验证后启用；文本块不补造时间/级别，不去重。
  const [reconnectVersion, setReconnectVersion] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const outputRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  useEffect(() => {
    const output = outputRef.current;
    if (output && shouldAutoScrollRef.current) output.scrollTop = output.scrollHeight;
  }, [logs]);
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
            signal: controller.signal,
            appendLog,
            onConnected: () => {
              if (!cancelled) {
                closeNotification(withId("instance-logs", id));
                setStreamStatus("connected");
              }
            },
          });
          if (result.type !== "done" || result.reason !== "timeout") {
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
  }, [active, instanceId, reconnectVersion]);
  const handleScroll = () => {
    const output = outputRef.current;
    if (output)
      shouldAutoScrollRef.current =
        output.scrollHeight - output.scrollTop - output.clientHeight <= AUTO_SCROLL_THRESHOLD_PX;
  };
  if (!active) return <Empty description="打开日志 Tab 后连接日志流" />;
  return (
    <div className="flex flex-col gap-3 h-full">
      <Space>
        <Typography.Text type="secondary">级别过滤</Typography.Text>
        <Select value="all" style={{ width: 140 }}>
          {LEVEL_OPTIONS.map((item) => (
            <Select.Option key={item.value} value={item.value} disabled={item.value !== "all"}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
        <Button
          disabled={!instanceId}
          loading={streamStatus === "connecting"}
          onClick={() => setReconnectVersion((version) => version + 1)}
        >
          重新连接
        </Button>
        <Typography.Text type="secondary">
          {streamStatus === "connected"
            ? "日志流已连接"
            : streamStatus === "connecting"
              ? "正在连接日志流…"
              : null}
        </Typography.Text>
      </Space>
      <div
        ref={outputRef}
        className="flex-1 basis-50 overflow-auto rounded border border-app-border-strong bg-[#282e3f] text-[#f7f8fa] [&_.arco-empty-description]:text-[#f7f8fa] [&_.arco-empty-icon]:text-[#f7f8fa]"
        onScroll={handleScroll}
      >
        {streamStatus === "connecting" && logs.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex items-center">
            <Empty description={streamStatus === "connected" ? "等待新日志" : "暂无日志"} />
          </div>
        ) : (
          <pre className="m-0 whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs leading-5 text-[#f7f8fa]">
            {logs.join("")}
          </pre>
        )}
      </div>
    </div>
  );
}
