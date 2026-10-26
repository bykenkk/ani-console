import { useEffect, useState } from "react";
import {
  streamInferenceLogs,
  type InferenceLogLine,
  type InferenceLogParams,
} from "@/api/inference";
import { closeNotification, showNotification } from "@/lib/feedback";
import { withId } from "@/lib/id";
import { readInferenceLogStream } from "./stream";

type InferenceLogStreamOptions = {
  serviceId: string;
  params: InferenceLogParams;
  enabled: boolean;
  connection: number;
};
type StreamStatus = "idle" | "connecting" | "connected";
export const INFERENCE_LOG_LIMIT = 1000;

export function useInferenceLogStream({
  serviceId,
  params,
  enabled,
  connection,
}: InferenceLogStreamOptions) {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [lines, setLines] = useState<InferenceLogLine[]>([]);
  const { instance, container, since, until, tail_lines, level } = params;
  useEffect(() => {
    if (!enabled) return;
    const notificationId = withId("inference-log-stream", serviceId);
    if (typeof AbortController === "undefined") {
      showNotification({
        id: notificationId,
        state: "error",
        action: "推理日志连接",
        content: "当前浏览器不支持实时日志连接",
      });
      return;
    }
    const controller = new AbortController();
    setLines([]);
    setStatus("connecting");
    async function connect() {
      try {
        const stream = await streamInferenceLogs(
          serviceId,
          { instance, container, since, until, tail_lines, level },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        closeNotification(notificationId);
        setStatus("connected");
        await readInferenceLogStream(stream, controller.signal, (line) => {
          if (!controller.signal.aborted)
            setLines((current) => [...current, line].slice(-INFERENCE_LOG_LIMIT));
        });
      } catch (error) {
        if (!controller.signal.aborted)
          showNotification({
            id: notificationId,
            state: "error",
            action: "推理日志连接",
            content: { error, fallback: "推理日志连接失败" },
          });
      } finally {
        if (!controller.signal.aborted) setStatus("idle");
      }
    }
    connect();
    // 切换 Tab、服务或筛选时取消请求和 reader；不自动重连，以免重复回放历史日志。
    return () => controller.abort();
  }, [serviceId, instance, container, since, until, tail_lines, level, enabled, connection]);
  return { lines, status: enabled ? status : "idle" };
}
