import type { InferenceLogLine } from "@/api/inference";
import { formatDateTime } from "@/lib/format";
import { normalizeLogText } from "@/lib/log-text";

export function formatInferenceLogs(lines: InferenceLogLine[]): string {
  return lines
    .map((line) => {
      const prefix = [
        line.timestamp ? `[${formatDateTime(line.timestamp)}]` : "",
        line.level ? `[${line.level}]` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const message = normalizeLogText(line.message);
      // 每项是一条日志记录；正文已有的换行、缩进及重复内容均保留。
      return `${prefix}${prefix && message ? " " : ""}${message}${message.endsWith("\n") ? "" : "\n"}`;
    })
    .join("");
}
