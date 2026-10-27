import { Space } from "@arco-design/web-react";
import type { StorageVolumeCondition, StorageVolumeEvent } from "@/api/storage/volumes";
import { DataTable } from "@/components/common";
import { formatDateTime } from "@/lib/format";
type VolumeObservationsProps = {
  conditions: StorageVolumeCondition[];
  events: StorageVolumeEvent[];
};
export default function VolumeObservations({ conditions, events }: VolumeObservationsProps) {
  return (
    <Space direction="vertical" className="w-full" size={16}>
      <DataTable<StorageVolumeCondition>
        header={{ title: "状态条件" }}
        pagination={false}
        data={conditions}
        rowKey="type"
        columns={[
          { title: "类型", width: 160, dataIndex: "type" },
          { title: "状态", width: 120, dataIndex: "status" },
          { title: "原因", width: 180, dataIndex: "reason", ellipsis: true },
          { title: "说明", width: 260, dataIndex: "message", ellipsis: true },
          {
            title: "更新时间",
            width: 180,
            render: (_, item) => formatDateTime(item.last_transition_time),
          },
        ]}
      />
      <DataTable<StorageVolumeEvent>
        header={{ title: "事件" }}
        pagination={false}
        data={events}
        rowKey={(item) =>
          JSON.stringify([item.type, item.reason, item.message, item.last_timestamp])
        }
        columns={[
          { title: "类型", width: 120, dataIndex: "type" },
          { title: "原因", width: 180, dataIndex: "reason", ellipsis: true },
          { title: "说明", width: 260, dataIndex: "message", ellipsis: true },
          { title: "次数", width: 80, dataIndex: "count" },
          {
            title: "最近发生时间",
            width: 180,
            render: (_, item) => formatDateTime(item.last_timestamp),
          },
        ]}
      />
    </Space>
  );
}
