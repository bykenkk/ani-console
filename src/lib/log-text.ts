import stripAnsi from "strip-ansi";

export function normalizeLogText(text: string): string {
  return (
    stripAnsi(text)
      .replace(/\r\n?/g, "\n")
      // 日志按文本历史展示，保留换行和制表符，移除其余不可打印控制字符。
      .replace(/\p{Cc}/gu, (character) =>
        character === "\n" || character === "\t" ? character : "",
      )
  );
}
