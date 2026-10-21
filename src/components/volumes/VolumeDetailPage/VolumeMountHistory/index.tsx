import type { StorageVolumeMountHistoryEntry } from "@/api/storage/volumes";
import { DataTable, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type VolumeMountHistoryProps = { items: StorageVolumeMountHistoryEntry[] };

const actionText: Record<StorageVolumeMountHistoryEntry["action"], string> = {
  mount: "挂载",
  unmount: "卸载",
  create_from_snapshot: "从快照创建",
  os_init: "OS 初始化",
};

export default function VolumeMountHistory({ items }: VolumeMountHistoryProps) {
  return (
    <DataTable<StorageVolumeMountHistoryEntry>
      columns={[
        { title: "时间", width: 180, render: (_, item) => formatDateTime(item.at) },
        { title: "操作", width: 200, render: (_, item) => actionText[item.action] },
        { title: "目标", width: 280, dataIndex: "target" },
        { title: "结果", width: 120, render: (_, item) => <StatusBadge status={item.result} /> },
      ]}
      data={items}
      pagination={false}
    />
  );
}
