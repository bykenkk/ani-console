export function resolveWebSocketUrl(sessionId: string, ticket: string): string {
  if (!sessionId || !ticket) throw new Error("会话 ID 或连接票据缺失，请重新申请");
  const url = new URL(
    `/api/console-sessions/${encodeURIComponent(sessionId)}`,
    window.location.href,
  );
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.href;
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof URL.createObjectURL !== "function") {
    throw new Error("当前浏览器不支持文件下载");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function openExternalUrl(value: string, targetWindow?: Window): void {
  const url = new URL(value, window.location.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("外部链接协议无效");
  }

  if (targetWindow?.closed) throw new Error("新窗口已关闭，请重新打开");
  const targetDocument = targetWindow?.document ?? document;
  const anchor = targetDocument.createElement("a");
  anchor.href = url.href;
  anchor.target = targetWindow ? "_self" : "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  targetDocument.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

// 在用户点击时同步预留窗口，供异步获取地址后导航使用。
export function reserveExternalWindow() {
  if (typeof window.open !== "function") throw new Error("当前浏览器不支持打开新窗口");
  const popup = window.open("about:blank", "_blank");
  if (!popup) throw new Error("新窗口被浏览器拦截，请允许弹出窗口后重试");
  try {
    // 预留窗口必须保留句柄，因此在空白页阶段立即切断 opener。
    popup.opener = null;
    popup.document.title = "正在打开…";
  } catch {
    popup.close();
    throw new Error("无法准备新窗口，请检查浏览器设置后重试");
  }
  return {
    open: (value: string) => openExternalUrl(value, popup),
    close: () => popup.close(),
  };
}
