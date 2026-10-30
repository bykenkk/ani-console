import { useState } from "react";
import { Alert, Button, Descriptions, Modal } from "@arco-design/web-react";
import { ejectVmMedia, type VirtualMachine, type VmMediaSlot, type VmMediaState } from "@/api/vms";
import { DataTable, StatusBadge, type RowAction } from "@/components/common";
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
    if (!(row.state?.desiredMedia || row.state?.observedMedia)) return "当前光驱没有可弹出的光盘";
    return undefined;
  };
  const actions: RowAction<MediaSlotRow>[] = [
    {
      key: "set",
      label: "插入 / 更换光盘",
      disabled: () => disabled,
      onClick: (row) => setEditingSlot(row.slot),
    },
    {
      key: "eject",
      label: "弹出光盘",
      disabled: (row) => Boolean(ejectDisabledReason(row)),
      title: ejectDisabledReason,
      onClick: (row) => {
        Modal.confirm({
          title: "弹出光盘",
          content: `确认弹出 ${vm.name} 的${row.slot === "INSTALL" ? "系统安装光盘" : "驱动光盘"}？此操作不会删除系统盘或数据盘，也不会自动重启云主机。若当前运行中仍在使用该光盘，将在下次启动时生效。`,
          onOk: () => eject.mutateAsync(row.slot),
        });
      },
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Alert
        type="info"
        title="光盘用于安装系统或驱动"
        content="系统安装光盘用于安装操作系统，驱动光盘用于安装磁盘、网络等驱动。已保存配置决定下次启动使用哪张光盘；当前使用的光盘以运行状态为准。更换、弹出光盘和切换启动设备都不会自动重启云主机。"
      />
      <DataTable<MediaSlotRow>
        header={{ title: "虚拟光驱" }}
        data={SLOTS.map((slot) => ({ slot, state: vm.media?.find((item) => item.slot === slot) }))}
        rowKey="slot"
        pagination={false}
        tableLabel="云主机虚拟光驱"
        rowActions={actions}
        columns={[
          {
            title: "光驱用途",
            width: 200,
            render: (_, row) => (row.slot === "INSTALL" ? "系统安装光盘" : "驱动光盘"),
          },
          {
            title: "已保存的光盘标识",
            width: 240,
            render: (_, row) => (row.state ? row.state.desiredMedia || "未配置光盘" : "-"),
            ellipsis: true,
          },
          {
            title: "当前使用的光盘标识",
            width: 240,
            dataIndex: "state.observedMedia",
            ellipsis: true,
          },
          {
            title: "生效状态",
            width: 180,
            render: (_, row) => {
              if (!row.state) return <StatusBadge tone="neutral">尚未观测</StatusBadge>;
              if (row.state.pendingRestart)
                return <StatusBadge tone="warning">下次启动生效</StatusBadge>;
              if (!row.state.effectiveNow)
                return <StatusBadge tone="neutral">尚未确认生效</StatusBadge>;
              return (
                <StatusBadge tone="success">
                  {row.state.observedMedia ? "当前已生效" : "当前无光盘"}
                </StatusBadge>
              );
            },
          },
        ]}
      />
      <Descriptions
        title={
          <DataTableSectionHeader
            title="下次从哪里启动"
            className="mb-0"
            extra={
              <Button disabled={disabled} onClick={() => setEditingBoot(true)}>
                切换启动设备
              </Button>
            }
          />
        }
        data={[
          {
            label: "已保存的启动设备",
            value:
              vm.bootDevice === "SYSTEM_DISK"
                ? "系统盘"
                : vm.bootDevice === "INSTALL_MEDIA"
                  ? "系统安装光盘（ISO）"
                  : "-",
          },
        ]}
      />
      <p className="m-0 text-sm text-app-text-secondary">
        从 ISO
        安装系统时选择系统安装光盘；系统安装完成后选择系统盘。驱动光盘不用于启动系统。云主机正在运行时，切换后的配置在下次启动时使用。
      </p>
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
    </div>
  );
}
