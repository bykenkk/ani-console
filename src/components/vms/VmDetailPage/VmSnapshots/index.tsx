import { useState } from "react";
import { Button, Modal, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { deleteVmSnapshot, listVmSnapshots, type VirtualMachine, type VmSnapshot } from "@/api/vms";
import { DataTable, ResourceNameId, StatusBadge, type RowAction } from "@/components/common";
import VmCreateSnapshotModal from "@/components/vms/VmCreateSnapshotModal";
import VmRestoreSnapshotModal from "@/components/vms/VmRestoreSnapshotModal";
import VmSnapshotDetailModal from "@/components/vms/VmSnapshotDetailModal";
import { useVMMutation } from "@/hooks/useVMMutation";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";
import { vmIsClosed } from "@/lib/vms";

type VmSnapshotsProps = { vm: VirtualMachine };

export default function VmSnapshots({ vm }: VmSnapshotsProps) {
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string>();
  const [detailId, setDetailId] = useState<string>();
  const query = useQuery({
    queryKey: ["vms", vm.id, "snapshots"],
    queryFn: ({ signal }) => listVmSnapshots(vm.id, signal),
    meta: { errorNotification: { id: withId("vm-snapshots", vm.id), action: "快照列表加载" } },
  });
  const remove = useVMMutation<VmSnapshot>({
    vmId: vm.id,
    action: "删除快照",
    actionId: "vm-snapshot-delete",
    channel: "notification",
    mutationFn: (snapshot) =>
      deleteVmSnapshot(vm.id, snapshot.snapshotId, { expected_version: vm.version }),
  });
  const disabled = vmIsClosed(vm) || remove.busy;
  const restoring = query.data?.items?.find((snapshot) => snapshot.snapshotId === restoringId);
  const actions: RowAction<VmSnapshot>[] = [
    { key: "detail", label: "详情", onClick: (snapshot) => setDetailId(snapshot.snapshotId) },
    {
      key: "rollback",
      label: "回滚",
      disabled: (snapshot) => disabled || !snapshot.ready,
      onClick: (snapshot) => setRestoringId(snapshot.snapshotId),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: () => disabled,
      onClick: (snapshot) => {
        Modal.confirm({
          title: "删除快照",
          content: `确定删除快照 ${snapshot.snapshotId}？删除后不可用于恢复。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(snapshot),
        });
      },
    },
  ];
  return (
    <>
      <DataTable<VmSnapshot>
        header={{
          title: "快照",
          extra: (
            <Space>
              <Button loading={query.isFetching} onClick={() => query.refetch()}>
                刷新
              </Button>
              <Button disabled={disabled} onClick={() => setCreating(true)}>
                创建快照
              </Button>
            </Space>
          ),
        }}
        data={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey="snapshotId"
        pagination={false}
        rowActions={actions}
        columns={[
          // TODO(vm-snapshot-fields): 新契约未返回名称及创建时间，保留原列；补齐后使用真实字段。
          {
            title: "名称 / ID",
            width: 200,
            fixed: "left",
            render: (_, snapshot) => (
              <ResourceNameId name="-" id={snapshot.snapshotId} openable={false} />
            ),
          },
          {
            title: "状态",
            width: 120,
            render: (_, snapshot) => (
              <StatusBadge tone={snapshot.ready ? "success" : "warning"}>
                {snapshot.ready ? "就绪" : "未就绪"}
              </StatusBadge>
            ),
          },
          { title: "创建时间", width: 180, render: () => "-" },
          { title: "完整性", width: 180, dataIndex: "completeness" },
          {
            title: "包含内容",
            width: 220,
            render: (_, snapshot) => snapshot.included?.join("、") || "-",
            ellipsis: true,
          },
          {
            title: "排除内容",
            width: 220,
            render: (_, snapshot) => snapshot.excluded?.join("、") || "-",
            ellipsis: true,
          },
          {
            title: "说明",
            width: 220,
            render: (_, snapshot) => snapshot.indications?.join("、") || "-",
            ellipsis: true,
          },
          {
            title: "观测时间",
            width: 180,
            render: (_, snapshot) => formatDateTime(snapshot.observedAt),
          },
          { title: "原因", width: 220, dataIndex: "reason", ellipsis: true },
        ]}
      />
      {creating && (
        <VmCreateSnapshotModal
          vm={vm}
          onCancel={() => setCreating(false)}
          onSubmitted={() => setCreating(false)}
        />
      )}
      {restoring && (
        <VmRestoreSnapshotModal
          vm={vm}
          snapshot={restoring}
          onCancel={() => setRestoringId(undefined)}
          onSubmitted={() => setRestoringId(undefined)}
        />
      )}
      {detailId && (
        <VmSnapshotDetailModal
          vmId={vm.id}
          snapshotId={detailId}
          onCancel={() => setDetailId(undefined)}
        />
      )}
    </>
  );
}
