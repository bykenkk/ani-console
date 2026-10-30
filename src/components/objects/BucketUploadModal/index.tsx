import { uploadStorageObjectFile } from "@/api/storage/objects/legacy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StorageBucketRecord } from "@/api/storage/buckets/legacy";

import { Button, Modal, Typography, Upload } from "@arco-design/web-react";

type BucketUploadModalProps = {
  bucket: StorageBucketRecord;
  onCancel: () => void;
};

export default function BucketUploadModal({ bucket, onCancel }: BucketUploadModalProps) {
  const queryClient = useQueryClient();
  const upload = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "object-upload",
        action: "上传",
        errorFallback: "上传失败",
      },
    },
    mutationFn: (file: File) => uploadStorageObjectFile({ bucketId: bucket.id, file, prefix: "/" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bucket", bucket.id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["bucket-objects", bucket.id, "/"] }),
        queryClient.invalidateQueries({ queryKey: ["buckets"], refetchType: "none" }),
      ]);
      onCancel();
    },
  });

  return (
    <Modal
      visible
      title={`上传对象 · ${bucket.name}`}
      footer={null}
      onCancel={onCancel}
      unmountOnExit
    >
      <div className="flex w-full flex-col gap-4">
        <Typography.Text type="secondary">
          文件将上传到存储桶根目录，选择文件后立即开始上传。
        </Typography.Text>
        <Upload
          showUploadList={false}
          disabled={upload.isPending}
          customRequest={(options) => {
            upload.mutate(options.file as File);
            return { abort: () => undefined };
          }}
        >
          <Button type="primary" loading={upload.isPending}>
            选择文件并上传
          </Button>
        </Upload>
      </div>
    </Modal>
  );
}
