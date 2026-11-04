import { streamInstanceLogs } from "@/api/instances";
import { streamVmLogs } from "@/api/vms";
import { ApiError } from "@/api/request";
import { useEffect, useMemo, useState } from "react";
import LogViewer from "@/components/common/LogViewer";
import LogToolbar from "@/components/common/LogToolbar";
import { closeNotification, showNotification } from "@/lib/feedback";
import { withId } from "@/lib/id";
import { normalizeLogText } from "@/lib/log-text";
import { readLogStream } from "./utils";

type InstanceLogsProps = {
  instanceId?: string;
  instanceType: "vm" | "container" | "gpu_container";
};
type StreamStatus = "idle" | "connecting" | "connected";

const LOG_LIMIT = 1000;
const RETAINED_LINE_LIMIT = 5000;
const RETAINED_CHARACTER_LIMIT = 1_000_000;
const TIMEOUT_RECONNECT_DELAY_MS = 500;

export default function InstanceLogs({ instanceId, instanceType }: InstanceLogsProps) {
  // TODO(instance-logs): 沙箱的新日志契约尚未提供，待接口补齐后接入。
  // TODO(governance-instance-logs): 后端提供结构化日志与级别筛选契约后接入；文本块不补造时间/级别，不去重。
  const [request, setRequest] = useState({ follow: false, version: 0 });
  const [logs, setLogs] = useState("");
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const streaming = request.follow && streamStatus !== "idle";
  const text = useMemo(() => normalizeLogText(logs), [logs]);
  useEffect(() => {
    if (!instanceId) {
      setStreamStatus("idle");
      setLogs("");
      return;
    }
    const id = instanceId;
    const streamLogs = instanceType === "vm" ? streamVmLogs : streamInstanceLogs;
    const notificationId = withId("instance-logs", id);
    let cancelled = false;
    const controller = new AbortController();
    setLogs("");
    const appendLog = (chunk: string) => {
      if (!cancelled)
        setLogs((current) =>
          (current + chunk)
            .slice(-RETAINED_CHARACTER_LIMIT)
            .split("\n")
            .slice(-RETAINED_LINE_LIMIT)
            .join("\n"),
        );
    };
    async function connect() {
      closeNotification(notificationId);
      while (!cancelled && !controller.signal.aborted) {
        setStreamStatus("connecting");
        try {
          const stream = await streamLogs(
            id,
            { tailLines: LOG_LIMIT, follow: request.follow },
            controller.signal,
          );
          if (cancelled || controller.signal.aborted) return;
          closeNotification(notificationId);
          setStreamStatus("connected");
          const result = await readLogStream(stream, controller.signal, appendLog);
          if (cancelled || controller.signal.aborted) return;
          const timedOut =
            result.type === "done" &&
            (result.reason === "timeout" || result.reason === "TIME_LIMIT");
          if (!request.follow || !timedOut) {
            setStreamStatus("idle");
            if (result.type === "done" && result.reason !== "EOF")
              showNotification({
                id: notificationId,
                state: "info",
                action: "日志查看",
                content: timedOut ? "本次日志查看已超时，可重新加载" : "日志流已结束，可重新加载",
              });
            return;
          }
          await new Promise<void>((resolve) => {
            const finishWaiting = () => {
              clearTimeout(timer);
              controller.signal.removeEventListener("abort", finishWaiting);
              resolve();
            };
            const timer = setTimeout(finishWaiting, TIMEOUT_RECONNECT_DELAY_MS);
            controller.signal.addEventListener("abort", finishWaiting, { once: true });
          });
        } catch (error) {
          if (!cancelled && !controller.signal.aborted) {
            setStreamStatus("idle");
            showNotification({
              id: notificationId,
              state: "error",
              action: "日志流连接",
              content:
                error instanceof ApiError && error.status === 429
                  ? "日志连接数已达上限，请稍后重试"
                  : "日志流连接失败，请稍后重试",
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
  }, [instanceId, instanceType, request]);
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
      <LogToolbar
        follow={{
          active: streaming,
          disabled: !instanceId,
          onChange: (follow) => setRequest((current) => ({ follow, version: current.version + 1 })),
        }}
        refresh={{
          disabled: !instanceId,
          loading: !request.follow && streamStatus !== "idle",
          onClick: () => setRequest((current) => ({ follow: false, version: current.version + 1 })),
        }}
      />
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
