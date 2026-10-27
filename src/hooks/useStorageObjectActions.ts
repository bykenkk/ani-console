import { useMutation } from "@tanstack/react-query";
import { getStorageObjectDownload } from "@/api/storage/objects";
import type { RowAction } from "@/components/common";
import { reserveExternalWindow } from "@/lib/browser";
import { copyToClipboard } from "@/lib/clipboard";
import { showMessage } from "@/lib/feedback";

type StorageObjectTarget = { key: string; kind?: "object" | "prefix" };

export function useStorageObjectActions(bucketId: string) {
  const link = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "storage-object-download",
        action: "生成下载链接",
        errorFallback: "请求失败，请稍后重试",
      },
    },
    mutationFn: async ({
      item,
      copy,
      popup,
    }: {
      item: StorageObjectTarget;
      copy: boolean;
      popup?: ReturnType<typeof reserveExternalWindow>;
    }) => {
      try {
        const data = await getStorageObjectDownload({ bucket_id: bucketId, key: item.key });
        if (copy) await copyToClipboard(data.url, "临时链接");
        else popup?.open(data.url);
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
  });
  const download = (item: StorageObjectTarget) => {
    let popup: ReturnType<typeof reserveExternalWindow>;
    try {
      popup = reserveExternalWindow();
    } catch (error) {
      showMessage({
        type: "error",
        content: error instanceof Error ? error.message : "无法打开下载窗口",
      });
      return;
    }
    link.mutate({ item, copy: false, popup });
  };
  const actions: RowAction<StorageObjectTarget>[] = [
    {
      key: "copy-path",
      label: "复制路径",
      visible: (item) => item.kind !== "prefix",
      onClick: (item) => copyToClipboard(item.key, "对象路径"),
    },
    {
      key: "download",
      label: "下载",
      visible: (item) => item.kind !== "prefix",
      disabled: () => link.isPending,
      onClick: download,
    },
    {
      key: "copy-link",
      label: "复制临时链接",
      visible: (item) => item.kind !== "prefix",
      disabled: () => link.isPending,
      onClick: (item) => link.mutate({ item, copy: true }),
    },
    // TODO(storage-migration): 对象/目录删除及上传完成确认保留 useObjectActions 旧实现；新逻辑桶不调用旧接口。
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: () => true,
      tooltip: "暂未支持",
      onClick: () => {},
    },
  ];
  return { actions };
}
