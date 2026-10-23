import type { InferenceLogLine } from "@/api/inference";

export async function readInferenceLogStream(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  append: (line: InferenceLogLine) => void,
): Promise<void> {
  if (typeof TextDecoder === "undefined") throw new Error("当前浏览器不支持日志流解码");
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const cancel = () => {
    reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancel, { once: true });
  const consume = (frame: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (event === "done") return true;
    if (event === "error") throw new Error("推理日志流发生错误，请重新连接");
    if (event !== "log" || !data.length) return false;
    const value = JSON.parse(data.join("\n")) as InferenceLogLine;
    if (
      !value ||
      typeof value.message !== "string" ||
      (value.timestamp != null && typeof value.timestamp !== "string")
    )
      throw new Error("推理日志流返回了无法识别的数据");
    append(value);
    return false;
  };
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (signal.aborted) return;
      if (done) throw new Error("推理日志流已断开，请重新连接");
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      if (buffer.length > 131072) throw new Error("推理日志帧超过大小限制");
      for (const frame of frames) {
        if (frame.length > 131072) throw new Error("推理日志帧超过大小限制");
        if (consume(frame)) return;
      }
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
