import { useState } from "react";
import { Button, Modal, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import {
  attachVmDisk,
  deleteVmDisk,
  listVmDisks,
  type VirtualMachine,
  type VmDisk,
} from "@/api/vms";
import { DataTable, ResourceNameId, type RowAction } from "@/components/common";
import VmCreateDiskModal from "@/components/vms/VmCreateDiskModal";
import VmDetachDiskModal from "@/components/vms/VmDetachDiskModal";
import { useVMMutation } from "@/hooks/useVMMutation";
import { formatBytes } from "@/lib/format";
import { withId } from "@/lib/id";
import { vmIsClosed } from "@/lib/vms";

type VmDisksProps = { vm: VirtualMachine };

export default function VmDisks({ vm }: VmDisksProps) {
  const [creating, setCreating] = useState(false);
  const [detachingId, setDetachingId] = useState<string>();
  const query = useQuery({
    queryKey: ["vms", vm.id, "disks"],
    queryFn: ({ signal }) => listVmDisks(vm.id, signal),
    meta: { errorNotification: { id: withId("vm-disks", vm.id), action: "磁盘列表加载" } },
  });
  const attach = useVMMutation<VmDisk>({
    vmId: vm.id,
    action: "挂载数据盘",
    actionId: "vm-disk-attach",
    channel: "notification",
    mutationFn: (disk) => attachVmDisk(vm.id, disk.diskId, { expected_version: vm.version }),
  });
  const remove = useVMMutation<VmDisk>({
    vmId: vm.id,
    action: "删除数据盘",
    actionId: "vm-disk-delete",
    channel: "notification",
    mutationFn: (disk) => deleteVmDisk(vm.id, disk.diskId, { expected_version: vm.version }),
  });
  const disabled = vmIsClosed(vm) || attach.busy;
  const detaching = query.data?.items?.find((disk) => disk.diskId === detachingId);
  const actions: RowAction<VmDisk>[] = [
    {
      key: "attach",
      label: "挂载",
      disabled: (disk) => disabled || disk.attached,
      onClick: (disk) => {
        Modal.confirm({
          title: "挂载数据盘",
          content: `将 ${disk.name || disk.diskId} 挂载到 ${vm.name}？`,
          onOk: () => attach.mutateAsync(disk),
        });
      },
    },
    {
      key: "detach",
      label: "卸载",
      disabled: (disk) => disabled || !disk.attached,
      onClick: (disk) => setDetachingId(disk.diskId),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (disk) => disabled || disk.attached,
      title: (disk) => (disk.attached ? "请先卸载磁盘" : undefined),
      onClick: (disk) => {
        Modal.confirm({
          title: "删除数据盘",
          content: `删除 ${disk.name || disk.diskId}（${disk.diskId}）及其数据？此操作不可撤销。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(disk),
        });
      },
    },
  ];
  return (
    <>
      <DataTable<VmDisk>
        header={{
          title: "磁盘",
          extra: (
            <Space>
              <Button loading={query.isFetching} onClick={() => query.refetch()}>
                刷新
              </Button>
              <Button disabled={disabled} onClick={() => setCreating(true)}>
                新增数据盘
              </Button>
            </Space>
          ),
        }}
        data={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey="diskId"
        pagination={false}
        rowActions={actions}
        columns={[
          {
            title: "名称 / ID",
            width: 200,
            fixed: "left",
            render: (_, disk) => (
              <ResourceNameId name={disk.name || "-"} id={disk.diskId} openable={false} />
            ),
          },
          { title: "角色", width: 120, dataIndex: "role" },
          { title: "容量 (GB)", width: 140, dataIndex: "sizeGb" },
          {
            title: "请求容量",
            width: 140,
            render: (_, disk) =>
              disk.requestedBytes ? formatBytes(Number(disk.requestedBytes)) : "-",
          },
          {
            title: "观测容量",
            width: 140,
            render: (_, disk) =>
              disk.observedCapacityBytes ? formatBytes(Number(disk.observedCapacityBytes)) : "-",
          },
          {
            title: "挂载状态",
            width: 120,
            render: (_, disk) => (disk.attached ? "已挂载" : "未挂载"),
          },
          { title: "准备状态", width: 120, dataIndex: "preparationState" },
          { title: "原因", width: 220, dataIndex: "reason", ellipsis: true },
          { title: "卷名", width: 180, dataIndex: "volumeName", ellipsis: true },
          { title: "序列号", width: 180, dataIndex: "serial", ellipsis: true },
        ]}
      />
      {creating && (
        <VmCreateDiskModal
          vm={vm}
          onCancel={() => setCreating(false)}
          onSubmitted={() => setCreating(false)}
        />
      )}
      {detaching && (
        <VmDetachDiskModal
          vm={vm}
          disk={detaching}
          onCancel={() => setDetachingId(undefined)}
          onSubmitted={() => setDetachingId(undefined)}
        />
      )}
    </>
  );
}
