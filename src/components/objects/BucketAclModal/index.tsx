import { Modal } from "@arco-design/web-react";
import type { StorageBucketRecord } from "@/api/storage/buckets";
import BucketAclEditor from "@/components/objects/BucketAclEditor";

type BucketAclModalProps = {
  bucket: StorageBucketRecord;
  onCancel: () => void;
};

export default function BucketAclModal({ bucket, onCancel }: BucketAclModalProps) {
  return (
    <Modal
      visible
      title={`修改权限 · ${bucket.name}`}
      footer={null}
      onCancel={onCancel}
      unmountOnExit
    >
      <BucketAclEditor bucket={bucket} onSaved={onCancel} />
    </Modal>
  );
}
