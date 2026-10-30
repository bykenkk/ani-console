import { Button, Form, Input, Modal, Typography, Upload } from "@arco-design/web-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadStorageObjectFile } from "@/api/storage/objects";
import type { StorageBucketRecord } from "@/api/storage/buckets";

type StorageBucketUploadModalProps = {
  bucket: StorageBucketRecord;
  prefix?: string;
  onCancel: () => void;
  onUploaded?: () => void;
};
type StorageObjectUploadFormValues = { key: string; file?: File };

export default function StorageBucketUploadModal({
  bucket,
  prefix = "",
  onCancel,
  onUploaded,
}: StorageBucketUploadModalProps) {
  const [values, setValues] = useState<StorageObjectUploadFormValues>({ key: prefix });
  const [submitted, setSubmitted] = useState(false);
  const keyError = !values.key
    ? "请输入文件路径（包含文件名）"
    : values.key.startsWith("/") ||
        values.key.endsWith("/") ||
        values.key.includes("\0") ||
        new Blob([values.key]).size > 1024
      ? "路径不能以 / 开头或结尾、包含 NUL，且不能超过 1024 字节"
      : undefined;
  const fileError = !values.file
    ? "请选择文件"
    : values.file.size <= 0 || values.file.size > 2147483648
      ? "文件大小必须大于 0 且不超过 2 GiB"
      : undefined;
  const queryClient = useQueryClient();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const upload = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "上传对象",
        successText: "对象已上传",
        errorFallback: "上传失败",
      },
    },
    mutationFn: async () => {
      setSubmitted(true);
      if (keyError || fileError || !values.file)
        throw new Error(keyError || fileError || "请选择文件");
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      await uploadStorageObjectFile({
        bucketId: bucket.id,
        key: values.key,
        file: values.file,
        signal: current.signal,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["storage", "objects", bucket.id],
          refetchType: "none",
        }),
        queryClient.invalidateQueries({ queryKey: ["storage", "object", bucket.id] }),
        queryClient.invalidateQueries({ queryKey: ["storage", "bucket-stats", bucket.id] }),
      ]);
      onUploaded?.();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title={`上传对象 · ${bucket.name}`}
      onCancel={onCancel}
      onOk={() => upload.mutateAsync()}
      okText="上传"
      confirmLoading={upload.isPending}
    >
      <Form layout="vertical">
        <Form.Item
          label="文件路径"
          required
          validateStatus={submitted && keyError ? "error" : undefined}
          help={submitted ? keyError : undefined}
          extra="填写包含文件名的完整对象路径，例如 docs/readme.txt。"
        >
          <Input
            value={values.key}
            onChange={(key) => setValues((current) => ({ ...current, key }))}
            placeholder="例如 docs/readme.txt"
            disabled={upload.isPending}
          />
        </Form.Item>
        <Form.Item
          label="文件"
          required
          validateStatus={submitted && fileError ? "error" : undefined}
          help={submitted ? fileError : undefined}
        >
          <div className="flex min-w-0 flex-col gap-2">
            <Upload
              showUploadList={false}
              disabled={upload.isPending}
              beforeUpload={(file) => {
                setValues((current) => ({
                  file,
                  key:
                    !current.key || current.key === prefix ? `${prefix}${file.name}` : current.key,
                }));
                return false;
              }}
            >
              <Button disabled={upload.isPending}>选择文件</Button>
            </Upload>
            {values.file ? (
              <Typography.Text className="break-all">{values.file.name}</Typography.Text>
            ) : null}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
