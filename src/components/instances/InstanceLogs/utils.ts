type StreamResult = { type: "done"; reason: string } | { type: "closed" };

export async function readLogStream(
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
