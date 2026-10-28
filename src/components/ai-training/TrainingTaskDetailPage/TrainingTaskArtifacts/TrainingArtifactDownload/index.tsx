import { useEffect, useRef } from "react";
import { Button } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { downloadModelDevArtifact, type ModelDevArtifact } from "@/api/modeldev";
import { downloadBlob } from "@/lib/browser";
import { withId } from "@/lib/id";

type TrainingArtifactDownloadProps = { artifact: ModelDevArtifact };

export default function TrainingArtifactDownload({ artifact }: TrainingArtifactDownloadProps) {
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
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
    mutationFn: async (downloadController: AbortController) => {
      try {
        const blob = await downloadModelDevArtifact(
          artifact.artifact_id,
          downloadController.signal,
        );
        if (downloadController.signal.aborted) throw new Error("下载已取消");
        const filename = artifact.filename.split(/[\\/]/).pop() || artifact.artifact_id;
        // Blob 仅交给公共下载适配器，不复制文件字节或放入 mutation 缓存。
        downloadBlob(blob, filename);
      } finally {
        if (controller.current === downloadController) controller.current = null;
      }
    },
  });
  return (
    <Button
      type="text"
      loading={download.isPending}
      disabled={artifact.delivery_state !== "PUBLISHED"}
      onClick={() => {
        if (controller.current || download.isPending) return;
        const downloadController = new AbortController();
        controller.current = downloadController;
        download.mutate(downloadController);
      }}
    >
      下载
    </Button>
  );
}
