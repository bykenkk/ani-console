import type { StorageVolumeAutoSnapshotPolicy } from "@/api/storage/volumes";
import EditVolumeAutoSnapshotPolicyModal from "@/components/storage/EditVolumeAutoSnapshotPolicyModal";
import { Button, Descriptions, Empty, Space } from "@arco-design/web-react";
import { useState } from "react";

type VolumeAutoSnapshotProps = {
  volumeId: string;
  policy?: StorageVolumeAutoSnapshotPolicy;
};

export default function VolumeAutoSnapshot({ volumeId, policy }: VolumeAutoSnapshotProps) {
  const [editorVisible, setEditorVisible] = useState(false);

  if (!policy) {
    return <Empty description="暂无自动快照策略" />;
  }

  return (
    <>
      <Space direction="vertical" size={16} className="w-full">
        <div className="flex justify-end">
          <Button onClick={() => setEditorVisible(true)}>编辑策略</Button>
        </div>
        <Descriptions
          border
          column={1}
          data={[
            { label: "启用状态", value: policy.enabled ? "已开启" : "已关闭" },
            { label: "保留天数", value: `${policy.retain_days} 天` },
            { label: "执行计划", value: policy.schedule },
          ]}
        />
      </Space>
      {editorVisible && (
        <EditVolumeAutoSnapshotPolicyModal
          volumeId={volumeId}
          policy={policy}
          onCancel={() => setEditorVisible(false)}
        />
      )}
    </>
  );
}
