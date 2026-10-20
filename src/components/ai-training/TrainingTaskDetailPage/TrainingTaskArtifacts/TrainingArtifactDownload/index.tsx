import { useEffect, useRef } from "react";
import { Button } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { authorizeModelDevArtifactDownload, type ModelDevArtifact } from "@/api/modeldev";
import { reserveExternalWindow } from "@/lib/browser";
import { isDateTimeExpired, isValidDateTime } from "@/lib/date";
import { withId } from "@/lib/id";
import { showMessage } from "@/lib/feedback";

type TrainingArtifactDownloadProps = { artifact: ModelDevArtifact };

export default function TrainingArtifactDownload({ artifact }: TrainingArtifactDownloadProps) {
  const pending = useRef<ReturnType<typeof reserveExternalWindow> | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      pending.current?.close();
    },
    [],
  );
  const download = useMutation({
    networkMode: "always",
    meta: {
      feedback: {
        channel: "notification",
        id: withId("training-download", artifact.artifact_id),
        action: "下载训练产物",
        successText: "已发起下载",
        errorFallback: "下载失败，请重试",
      },
    },
    mutationFn: async () => {
      try {
        controller.current = new AbortController();
        const result = await authorizeModelDevArtifactDownload(
          artifact.artifact_id,
          controller.current.signal,
        );
        if (!pending.current || controller.current.signal.aborted) return;
        if (
          !result.expires_at ||
          !isValidDateTime(result.expires_at) ||
          isDateTimeExpired(result.expires_at)
        )
          throw new Error("下载地址已过期，请重试");
        if (new URL(result.download_url).protocol !== "https:") throw new Error("下载地址无效");
        // 短期凭据只用于即时导航，不进入 mutation 返回值或持久化存储。
        pending.current.open(result.download_url);
        pending.current = null;
      } catch (error) {
        pending.current?.close();
        pending.current = null;
        throw error;
      } finally {
        controller.current = null;
      }
    },
  });
  return (
    <Button
      type="text"
      loading={download.isPending}
      disabled={artifact.delivery_state !== "PUBLISHED"}
      onClick={() => {
        if (pending.current || download.isPending) return;
        try {
          pending.current = reserveExternalWindow();
          download.mutate();
        } catch {
          showMessage({ type: "error", content: "请允许弹出窗口后重试" });
        }
      }}
    >
      下载
    </Button>
  );
}
