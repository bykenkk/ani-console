import { streamInstanceLogs } from "@/api/instances";
import { streamVmLogs } from "@/api/vms";
import { ApiError } from "@/api/request";
import { useEffect, useMemo, useState } from "react";
import { Button, Empty } from "@arco-design/web-react";
import { IconPlayArrowFill, IconRecordStop, IconRefresh } from "@arco-design/web-react/icon";
import LogViewer from "@/components/common/LogViewer";
import { closeNotification, showNotification } from "@/lib/feedback";
import { withId } from "@/lib/id";
import { normalizeLogText } from "@/lib/log-text";

type InstanceLogsProps = {
  instanceId?: string;
  active: boolean;
  resourceType?: "instance" | "vm";
  onNotFound?: () => void;
};
type StreamStatus = "idle" | "connecting" | "connected";
type StreamResult = { type: "done"; reason: string } | { type: "closed" };

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
  resourceType,
  follow,
  signal,
  appendLog,
  onConnected,
}: {
  instanceId: string;
  resourceType: "instance" | "vm";
  follow: boolean;
  signal: AbortSignal;
  appendLog: (text: string) => void;
  onConnected: () => void;
}): Promise<StreamResult> {
  const streamLogs = resourceType === "vm" ? streamVmLogs : streamInstanceLogs;
  const data = await streamLogs(instanceId, { tailLines: LOG_LIMIT, follow }, signal);
  onConnected();
  return readLogStream(data, signal, appendLog);
}

export default function InstanceLogs({
  instanceId,
  active,
  resourceType = "instance",
  onNotFound,
}: InstanceLogsProps) {
  // TODO(instance-logs): 沙箱的新日志契约尚未提供，待接口补齐后接入。
  // TODO(governance-instance-logs): 后端提供结构化日志与级别筛选契约后接入；文本块不补造时间/级别，不去重。
  const [request, setRequest] = useState({ follow: false, version: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const notificationScope = resourceType === "vm" ? "vm-logs" : "instance-logs";
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
      if (!cancelled)
        setLogs((current) => {
          if (resourceType !== "vm") return [...current, text];
          // 保留片段拼接语义，同时限制行数与超长单行，避免持续跟随无限占用内存。
          return [(current.join("") + text).slice(-1_000_000).split("\n").slice(-5000).join("\n")];
        });
    };
    async function connect() {
      closeNotification(withId(notificationScope, id));
      while (!cancelled && !controller.signal.aborted) {
        setStreamStatus("connecting");
        try {
          const result = await connectLogStream({
            instanceId: id,
            resourceType,
            follow: request.follow,
            signal: controller.signal,
            appendLog,
            onConnected: () => {
              if (!cancelled) {
                closeNotification(withId(notificationScope, id));
                setStreamStatus("connected");
              }
            },
          });
          if (
            !cancelled &&
            resourceType === "vm" &&
            result.type === "done" &&
            result.reason !== "EOF"
          ) {
            showNotification({
              id: withId(notificationScope, id),
              state: "info",
              action: "云主机日志",
              content:
                result.reason === "TIME_LIMIT"
                  ? "本次查看已超时，可重新加载"
                  : "云主机运行实例已变化，可重新加载",
            });
          }
          if (
            resourceType === "vm" ||
            !request.follow ||
            result.type !== "done" ||
            result.reason !== "timeout"
          ) {
            if (!cancelled) setStreamStatus("idle");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, TIMEOUT_RECONNECT_DELAY_MS));
        } catch (error) {
          if (!cancelled && !controller.signal.aborted) {
            setStreamStatus("idle");
            if (
              resourceType === "vm" &&
              error instanceof ApiError &&
              error.status === 404 &&
              error.code === "VM_NOT_FOUND"
            )
              onNotFound?.();
            const message =
              resourceType === "vm" && error instanceof ApiError
                ? error.status === 409
                  ? "云主机未运行或日志暂不可用"
                  : error.status === 429
                    ? "日志连接数已达上限，请稍后重试"
                    : error.status === 404 && error.code !== "VM_NOT_FOUND"
                      ? "云主机日志功能未上线"
                      : undefined
                : undefined;
            showNotification({
              id: withId(notificationScope, id),
              state: "error",
              action: "日志流连接",
              content: message ?? { error, fallback: "日志流连接失败" },
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
  }, [active, instanceId, request, resourceType, notificationScope, onNotFound]);
  if (!active) return <Empty description="打开日志 Tab 后连接日志流" />;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        {/* 预留后续日志筛选控件区域。 */}
        <div className="flex min-w-0 flex-wrap items-center gap-2" />
        <div className="flex shrink-0 items-center gap-2">
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
            onClick={() =>
              setRequest((current) => ({ follow: false, version: current.version + 1 }))
            }
          />
        </div>
      </div>
      <LogViewer
        key={`${instanceId ?? ""}:${request.version}`}
        className="flex-1"
        text={text}
        loading={streamStatus === "connecting" || (!request.follow && streamStatus === "connected")}
        emptyDescription={streaming && streamStatus === "connected" ? "等待新日志" : "暂无日志"}
        ariaLabel={resourceType === "vm" ? "云主机串口日志" : "实例日志"}
      />
    </div>
  );
}
