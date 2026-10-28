import { Button, Descriptions, Empty, Modal, Space, Spin } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getVmSnapshot } from "@/api/vms";
import { DataTable, ResourceId, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type VmSnapshotDetailModalProps = { vmId: string; snapshotId: string; onCancel: () => void };

export default function VmSnapshotDetailModal({
  vmId,
  snapshotId,
  onCancel,
}: VmSnapshotDetailModalProps) {
  const query = useQuery({
    queryKey: ["vms", vmId, "snapshots", snapshotId],
    queryFn: ({ signal }) => getVmSnapshot(vmId, snapshotId, signal),
    meta: { errorNotification: { id: withId("vm-snapshot", snapshotId), action: "快照详情加载" } },
  });
  const snapshot = query.data;
  return (
    <Modal
      visible
      title="快照详情"
      style={{ width: 850 }}
      onCancel={onCancel}
      footer={
        <Space>
          <Button loading={query.isFetching} onClick={() => query.refetch()}>
            刷新
          </Button>
          <Button onClick={onCancel}>关闭</Button>
        </Space>
      }
    >
      <Spin loading={query.isLoading} className="w-full">
        {snapshot ? (
          <Space direction="vertical" size={20} className="w-full">
            <Descriptions
              column={1}
              data={[
                // TODO(vm-snapshot-fields): 名称、创建时间待正式查询契约补齐后回显。
                { label: "名称", value: "-" },
                { label: "ID", value: <ResourceId value={snapshot.snapshotId} /> },
                { label: "来源 VM", value: <ResourceId value={snapshot.sourceVmId} /> },
                { label: "来源 VM UID", value: snapshot.sourceVmUid || "-" },
                {
                  label: "状态",
                  value: (
                    <StatusBadge tone={snapshot.ready ? "success" : "warning"}>
                      {snapshot.ready ? "就绪" : "未就绪"}
                    </StatusBadge>
                  ),
                },
                { label: "创建时间", value: "-" },
                { label: "观测时间", value: formatDateTime(snapshot.observedAt) },
                { label: "完整性", value: snapshot.completeness || "-" },
                { label: "包含内容", value: snapshot.included?.join("、") || "-" },
                { label: "排除内容", value: snapshot.excluded?.join("、") || "-" },
                { label: "说明", value: snapshot.indications?.join("、") || "-" },
                { label: "原因", value: snapshot.reason || "-" },
              ]}
            />
            <DataTable
              header={{ title: "快照磁盘" }}
              data={snapshot.disks ?? []}
              rowKey="diskId"
              pagination={false}
              columns={[
                { title: "名称", width: 200, dataIndex: "name", ellipsis: true },
                { title: "磁盘 ID", width: 220, dataIndex: "diskId", ellipsis: true },
                { title: "角色", width: 120, dataIndex: "role" },
                { title: "容量 (GB)", width: 140, dataIndex: "sizeGb" },
                { title: "准备状态", width: 120, dataIndex: "preparationState" },
                { title: "原因", width: 220, dataIndex: "reason", ellipsis: true },
              ]}
            />
          </Space>
        ) : (
          <Empty />
        )}
      </Spin>
    </Modal>
  );
}
