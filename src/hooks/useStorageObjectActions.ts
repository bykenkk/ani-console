import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@arco-design/web-react";
import { ApiError } from "@/api/request";
import {
  deleteStorageObject,
  getStorageObject,
  getStorageObjectDownload,
} from "@/api/storage/objects";
import type { RowAction } from "@/components/common";
import { reserveExternalWindow } from "@/lib/browser";
import { copyToClipboard } from "@/lib/clipboard";
import { showMessage } from "@/lib/feedback";

type StorageObjectTarget = { key: string; kind?: "object" | "prefix"; etag?: string };

export function useStorageObjectActions(bucketId: string, onDeleted?: () => void) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "storage-object-delete",
        action: "删除对象",
        successText: "对象已删除",
        errorFallback: "删除失败",
      },
    },
    mutationFn: async (item: StorageObjectTarget) => {
      const object = item.etag
        ? item
        : await getStorageObject({ bucket_id: bucketId, key: item.key });
      await deleteStorageObject({
        bucket_id: bucketId,
        key: item.key,
        expected_etag: object.etag || undefined,
      });
    },
    onSuccess: async (_, item) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["storage", "objects", bucketId],
          refetchType: onDeleted ? "none" : "active",
        }),
        queryClient.invalidateQueries({
          queryKey: ["storage", "object", bucketId, item.key],
          exact: true,
          refetchType: "none",
        }),
        queryClient.invalidateQueries({ queryKey: ["storage", "bucket-stats", bucketId] }),
      ]);
      onDeleted?.();
    },
    onError: async (error) => {
      if (
        error instanceof ApiError &&
        (error.code === "OBJECT_IDENTITY_CHANGED" || error.code === "STORAGE_RESOURCE_CONFLICT")
      ) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["storage", "objects", bucketId] }),
          queryClient.invalidateQueries({ queryKey: ["storage", "object", bucketId] }),
        ]);
      }
    },
  });
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
    // TODO(storage-migration): 新接口不支持递归删除目录；保留原目录删除入口待后端提供契约。
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (item) => remove.isPending || item.kind === "prefix",
      tooltip: (item) => (item.kind === "prefix" ? "暂未支持" : undefined),
      onClick: (item) => {
        if (item.kind === "prefix" || remove.isPending) return;
        Modal.confirm({
          title: "删除对象",
          content: `确定删除「${item.key}」？`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(item),
        });
      },
    },
  ];
  return { actions };
}
