import { useState } from "react";
import { Alert, Button, Checkbox, Descriptions, Modal, Space } from "@arco-design/web-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  previewVmRestore,
  restoreVmSnapshot,
  type VirtualMachine,
  type VmSnapshot,
  type VmRestorePreview,
} from "@/api/vms";
import { DataTable } from "@/components/common";
import { useVMMutation } from "@/hooks/useVMMutation";
import { withId } from "@/lib/id";
import { vmIsClosed } from "@/lib/vms";

type VmRestoreSnapshotModalProps = {
  vm: VirtualMachine;
  snapshot: VmSnapshot;
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function VmRestoreSnapshotModal({
  vm,
  snapshot,
  onCancel,
  onSubmitted,
}: VmRestoreSnapshotModalProps) {
  const client = useQueryClient();
  const [confirmed, setConfirmed] = useState<string>();
  const preview = useQuery({
    queryKey: ["vms", vm.id, "restore-preview", snapshot.snapshotId, vm.version],
    queryFn: ({ signal }) => previewVmRestore(vm.id, snapshot.snapshotId, signal),
    staleTime: 0,
    refetchOnMount: "always",
    meta: {
      errorNotification: {
        id: withId("vm-restore-preview", snapshot.snapshotId),
        action: "恢复预览加载",
      },
    },
  });
  const data = preview.data;
  const token = data
    ? `${vm.version}:${data.version}:${data.snapshotUid}:${data.previewDigest}`
    : undefined;
  const mutation = useVMMutation<VmRestorePreview>({
    vmId: vm.id,
    action: "恢复快照",
    actionId: "vm-snapshot-restore",
    onSubmitted,
    onConflict: () => setConfirmed(undefined),
    mutationFn: (acceptedPreview) =>
      restoreVmSnapshot(vm.id, snapshot.snapshotId, {
        expected_version: acceptedPreview.version,
        preview_digest: acceptedPreview.previewDigest,
        destructive_confirmation: true,
      }),
  });
  const canConfirm =
    !vmIsClosed(vm) &&
    snapshot.ready &&
    !preview.isFetching &&
    !preview.isError &&
    Boolean(data?.previewDigest) &&
    data?.snapshotId === snapshot.snapshotId &&
    !mutation.busy;
  return (
    <Modal
      visible
      title={`恢复快照 · ${vm.name}`}
      style={{ width: 850 }}
      onCancel={onCancel}
      confirmLoading={mutation.isPending}
      okText="确认恢复"
      okButtonProps={{ status: "danger", disabled: !canConfirm || confirmed !== token }}
      onOk={async () => {
        if (!canConfirm || !data || confirmed !== token) return;
        await mutation.mutateAsync(data);
      }}
    >
      <Space direction="vertical" size={16} className="w-full">
        <Alert
          type="warning"
          content="恢复将按以下预览修改磁盘，可能覆盖或移除现有数据。请确认影响范围；恢复后的运行状态以云主机实际状态为准。"
        />
        <Descriptions
          column={1}
          data={[
            { label: "快照 ID", value: snapshot.snapshotId },
            { label: "完整性", value: snapshot.completeness || "-" },
            { label: "包含内容", value: snapshot.included?.join("、") || "-" },
            { label: "排除内容", value: snapshot.excluded?.join("、") || "-" },
            { label: "说明", value: snapshot.indications?.join("、") || "-" },
            { label: "预览版本", value: data?.version ?? "-" },
          ]}
        />
        <DataTable
          data={data?.disks ?? []}
          rowKey="diskId"
          pagination={false}
          loading={preview.isFetching}
          columns={[
            { title: "磁盘 ID", width: 240, dataIndex: "diskId", ellipsis: true },
            { title: "恢复动作", width: 160, dataIndex: "action" },
            { title: "原因", width: 280, dataIndex: "reason", ellipsis: true },
          ]}
        />
        <Button
          disabled={mutation.busy}
          loading={preview.isFetching}
          onClick={() => {
            setConfirmed(undefined);
            return client.invalidateQueries({ queryKey: ["vms", vm.id] });
          }}
        >
          刷新预览
        </Button>
        <Checkbox
          disabled={!canConfirm}
          checked={Boolean(token && confirmed === token)}
          onChange={(checked) => setConfirmed(checked ? token : undefined)}
        >
          已阅读本次预览，确认恢复并接受数据覆盖风险
        </Checkbox>
      </Space>
    </Modal>
  );
}
