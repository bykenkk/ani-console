import { useClientPaginatedQuery } from "@/hooks/useClientPaginatedQuery";
import { listVolumeSnapshots, type VolumeSnapshotRecord } from "@/api/storage/volumes";
import { DataTable, StatusBadge } from "@/components/common";

import { formatBytes, formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { Button } from "@arco-design/web-react";

type VolumeSnapshotsProps = {
  volumeId: string;
  onCreateSnapshot: () => void;
};

export default function VolumeSnapshots({ volumeId, onCreateSnapshot }: VolumeSnapshotsProps) {
  const {
    query: snapshots,
    items: pageItems,
    pagination,
  } = useClientPaginatedQuery({
    errorNotification: {
      id: withId("volume-snapshots", volumeId),
      action: "快照列表加载",
      fallback: "请求失败，请稍后重试",
    },
    queryKey: ["volume-snapshots", volumeId],
    queryFn: () => listVolumeSnapshots(volumeId),
  });

  return (
    <>
      <div>
        <DataTable<VolumeSnapshotRecord>
          header={{
            title: "快照",
            extra: <Button onClick={onCreateSnapshot}>创建快照</Button>,
          }}
          columns={[
            { title: "名称", dataIndex: "name" },
            {
              title: "状态",
              width: 120,
              render: (_, row) => <StatusBadge status={row.status} />,
            },
            { title: "大小", render: (_, row) => formatBytes(row.size_bytes) },
            { title: "创建时间", render: (_, row) => formatDateTime(row.created_at) },
          ]}
          data={pageItems}
          loading={snapshots.isLoading}
          pagination={pagination}
        />
      </div>
    </>
  );
}
