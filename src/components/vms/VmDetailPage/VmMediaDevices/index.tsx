import { useState } from "react";
import { Button, Descriptions, Modal, Space } from "@arco-design/web-react";
import { ejectVmMedia, type VirtualMachine, type VmMediaSlot, type VmMediaState } from "@/api/vms";
import { DataTable, type RowAction } from "@/components/common";
import DataTableSectionHeader from "@/components/common/DataTable/DataTableSectionHeader";
import VmSetMediaModal from "@/components/vms/VmSetMediaModal";
import VmSetBootDeviceModal from "@/components/vms/VmSetBootDeviceModal";
import { useVMMutation } from "@/hooks/useVMMutation";
import { vmIsClosed } from "@/lib/vms";

type VmMediaDevicesProps = { vm: VirtualMachine };
type MediaSlotRow = { slot: VmMediaSlot; state?: VmMediaState };
const SLOTS: VmMediaSlot[] = ["INSTALL", "DRIVER"];

export default function VmMediaDevices({ vm }: VmMediaDevicesProps) {
  const [editingSlot, setEditingSlot] = useState<VmMediaSlot>();
  const [editingBoot, setEditingBoot] = useState(false);
  const eject = useVMMutation<VmMediaSlot>({
    vmId: vm.id,
    action: "弹出介质",
    actionId: "vm-media-eject",
    channel: "notification",
    mutationFn: (slot) => ejectVmMedia(vm.id, slot, { expected_version: vm.version }),
  });
  const disabled = vmIsClosed(vm) || eject.busy;
  const ejectDisabledReason = (row: MediaSlotRow) => {
    if (vmIsClosed(vm)) {
      if (vm.observedState === "Deleted") return "云主机已删除，无法弹出介质";
      if (vm.observedState === "canceled") return "云主机创建已取消，无法弹出介质";
      if (vm.closing) return "云主机正在删除，暂时无法弹出介质";
      return "云主机版本尚未就绪，请刷新后重试";
    }
    if (eject.busy) return "有虚拟机操作正在提交，请稍后重试";
    if (!(row.state?.desiredMedia || row.state?.observedMedia)) return "当前槽位没有可弹出的介质";
    return undefined;
  };
  const actions: RowAction<MediaSlotRow>[] = [
    {
      key: "set",
      label: "插入 / 更换",
      disabled: () => disabled,
      onClick: (row) => setEditingSlot(row.slot),
    },
    {
      key: "eject",
      label: "弹出",
      disabled: (row) => Boolean(ejectDisabledReason(row)),
      title: ejectDisabledReason,
      onClick: (row) => {
        Modal.confirm({
          title: "弹出介质",
          content: `确认弹出 ${vm.name} 的${row.slot === "INSTALL" ? "安装" : "驱动"}介质？可能需要重启后生效。`,
          onOk: () => eject.mutateAsync(row.slot),
        });
      },
    },
  ];
  return (
    <Space direction="vertical" size={24} className="w-full">
      <DataTable<MediaSlotRow>
        header={{ title: "介质" }}
        data={SLOTS.map((slot) => ({ slot, state: vm.media?.find((item) => item.slot === slot) }))}
        rowKey="slot"
        pagination={false}
        rowActions={actions}
        columns={[
          {
            title: "槽位",
            width: 160,
            dataIndex: "slot",
          },
          { title: "期望介质", width: 240, dataIndex: "state.desiredMedia", ellipsis: true },
          { title: "实际介质", width: 240, dataIndex: "state.observedMedia", ellipsis: true },
          {
            title: "当前生效",
            width: 120,
            render: (_, row) => (row.state ? (row.state.effectiveNow ? "是" : "否") : "-"),
          },
          {
            title: "待重启",
            width: 120,
            render: (_, row) => (row.state ? (row.state.pendingRestart ? "是" : "否") : "-"),
          },
        ]}
      />
      <Descriptions
        title={
          <DataTableSectionHeader
            title="启动设备"
            className="mb-0"
            extra={
              <Button disabled={disabled} onClick={() => setEditingBoot(true)}>
                切换
              </Button>
            }
          />
        }
        data={[
          {
            label: "当前配置",
            value:
              vm.bootDevice === "SYSTEM_DISK"
                ? "系统盘"
                : vm.bootDevice === "INSTALL_MEDIA"
                  ? "安装介质"
                  : "-",
          },
        ]}
      />
      {editingSlot && (
        <VmSetMediaModal
          vm={vm}
          slot={editingSlot}
          onCancel={() => setEditingSlot(undefined)}
          onSubmitted={() => setEditingSlot(undefined)}
        />
      )}
      {editingBoot && (
        <VmSetBootDeviceModal
          vm={vm}
          onCancel={() => setEditingBoot(false)}
          onSubmitted={() => setEditingBoot(false)}
        />
      )}
    </Space>
  );
}
