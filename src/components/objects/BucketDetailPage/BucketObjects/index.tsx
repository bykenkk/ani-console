import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { uploadStorageObjectFile } from "@/api/storage/objects/legacy";
import { useObjectActions } from "@/hooks/useObjectActions";
import { listBucketObjects } from "@/api/storage/buckets/legacy";
import ObjectBrowser from "@/components/objects/ObjectBrowser";
import { withId } from "@/lib/id";
import { Button, Upload } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type BucketObjectsProps = {
  bucketId: string;
};

export default function BucketObjects({ bucketId }: BucketObjectsProps) {
  const qc = useQueryClient();
  const [prefix, setPrefix] = useState("/");

  const {
    query: objects,
    items: entries,
    pagination,
  } = useCursorPaginatedQuery({
    queryKey: ["bucket-objects", bucketId, prefix],
    queryFn: (params) => listBucketObjects(bucketId, { ...params, prefix }),
    errorNotification: {
      id: withId("bucket-objects", bucketId, prefix),
      action: "对象列表加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  const { actions } = useObjectActions(bucketId);
  const upload = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "object-upload",
        action: "上传",
        errorFallback: "上传失败",
      },
    },
    mutationFn: ({ file, prefix }: { file: File; prefix: string }) =>
      uploadStorageObjectFile({ bucketId, file, prefix }),
    onSuccess: async (_, { prefix }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["bucket", bucketId], exact: true }),
        qc.invalidateQueries({ queryKey: ["bucket-objects", bucketId, prefix] }),
        qc.invalidateQueries({ queryKey: ["buckets"], refetchType: "none" }),
      ]);
    },
  });
  return (
    <>
      <ObjectBrowser
        prefix={prefix}
        entries={entries}
        pagination={pagination}
        loading={objects.isLoading}
        actions={actions}
        primaryAction={
          <Upload
            showUploadList={false}
            customRequest={(option) => upload.mutate({ file: option.file as File, prefix })}
          >
            <Button type="primary" loading={upload.isPending}>
              上传对象
            </Button>
          </Upload>
        }
        onNavigate={(target) => {
          setPrefix(target);
        }}
      />
    </>
  );
}
