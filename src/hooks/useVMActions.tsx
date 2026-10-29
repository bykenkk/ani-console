import { Modal } from "@arco-design/web-react";
import { useState } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/request";
import { startVm, restartVm, deleteVm, type VirtualMachine } from "@/api/vms";
import { unavailableAction, type RowAction } from "@/components/common/DataTable/RowActions";
import VmCreateSnapshotModal from "@/components/vms/VmCreateSnapshotModal";
import VmShutdownModal from "@/components/vms/VmShutdownModal";
import { openInstanceVncWindow } from "@/lib/instances";
import { vmIsClosed } from "@/lib/vms";
import { withId } from "@/lib/id";

type VmPowerAction = "start" | "restart" | "delete";
type VmActionDialog = { action: "stop" | "snapshot"; vm: VirtualMachine };
const LABELS: Record<VmPowerAction, string> = {
  start: "开机",
  restart: "重启",
  delete: "删除",
};
export function useVMActions(records: VirtualMachine[], onDeleted?: () => void) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<VmActionDialog>();
  // 列表或详情刷新后沿用新版本，弹窗自身的输入保持不变。
  const dialogVm = records.find((vm) => vm.id === dialog?.vm.id) ?? dialog?.vm;
  const pending = useIsMutating({ mutationKey: ["vm-write"] });
  const mutation = useMutation({
    mutationKey: ["vm-write", "power"],
    retry: false,
    mutationFn: async ({ action, vm }: { action: VmPowerAction; vm: VirtualMachine }) => {
      const input = { expected_version: vm.version };
      await { start: startVm, restart: restartVm, delete: deleteVm }[action](vm.id, input);
    },
    meta: {
      feedback: (variables) => {
        const { action, vm } = variables as { action: VmPowerAction; vm: VirtualMachine };
        return {
          channel: "notification",
          id: withId(`vm-${action}`, vm.id),
          action: LABELS[action],
          successText: `${LABELS[action]}已提交`,
        };
      },
    },
    onSuccess: async (_, { action, vm }) => {
      // TODO(vm-task): 创建、删除任务跟踪暂缓，仅刷新资源及列表。
      if (action === "delete") {
        await qc.invalidateQueries({ queryKey: ["vms", vm.id], refetchType: "none" });
        onDeleted?.();
        await qc.invalidateQueries({ queryKey: ["vms", "list"] });
      } else await qc.invalidateQueries({ queryKey: ["vms"] });
    },
    onError: async (error, { vm }) => {
      if (error instanceof ApiError && error.status === 409) {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["vms", vm.id] }),
          qc.invalidateQueries({ queryKey: ["vms", "list"] }),
        ]);
      }
    },
  });
  const confirm = (action: VmPowerAction, vm: VirtualMachine) => {
    const dialog = Modal.confirm({
      title: `${LABELS[action]} ${vm.name}`,
      content:
        action === "delete"
          ? "将删除该云主机及其自有磁盘、介质副本和快照。此操作不可撤销。"
          : `确认${LABELS[action]}该云主机？`,
      okButtonProps: {
        status: action === "delete" ? "danger" : "default",
      },
      onOk: async () => {
        try {
          await mutation.mutateAsync({ action, vm });
        } catch (error) {
          // 版本冲突后关闭持有旧行数据的确认框，由用户基于刷新后的资源重新确认。
          if (error instanceof ApiError && error.status === 409) dialog.close();
          throw error;
        }
      },
    });
  };
  const unavailable = (vm: VirtualMachine) => vmIsClosed(vm) || pending > 0 || Boolean(dialog);
  // TODO(vm-legacy-actions): 未提供正式契约的操作保留禁用；旧 useLegacyVMActions 仅作迁移参考。
  const actions: RowAction<VirtualMachine>[] = [
    {
      key: "lifecycle",
      label: (vm) => (vm.observedState === "Running" ? "关机" : "开机"),
      widthLabel: "关机",
      disabled: unavailable,
      onClick: (vm) => {
        if (vm.observedState === "Running") setDialog({ action: "stop", vm });
        else confirm("start", vm);
      },
    },
    {
      key: "restart",
      label: "重启",
      disabled: (vm) => unavailable(vm) || vm.observedState !== "Running",
      onClick: (vm) => confirm("restart", vm),
    },
    unavailableAction("resize", "变配"),
    unavailableAction("rebuild", "重建"),
    {
      key: "snapshot",
      label: "创建快照",
      disabled: unavailable,
      onClick: (vm) => setDialog({ action: "snapshot", vm }),
    },
    unavailableAction("attach-volume", "挂载云盘"),
    unavailableAction("detach-volume", "卸载云盘"),
    // TODO(feature-visibility): 待文件存储支持后恢复 NFS 挂载入口。
    // unavailableAction("attach-filesystem", "挂载 NFS"),
    // TODO(feature-visibility): 待安全组支持后恢复更换入口。
    // unavailableAction("change-security-groups", "更换安全组"),
    unavailableAction("termination-protection", "终止保护"),
    {
      key: "console",
      label: "打开控制台",
      disabled: (vm) => unavailable(vm) || vm.observedState !== "Running",
      onClick: (vm) => openInstanceVncWindow(vm.id),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: unavailable,
      onClick: (vm) => confirm("delete", vm),
    },
  ];
  const closeDialog = () => setDialog(undefined);
  const dialogNode =
    dialogVm && dialog ? (
      dialog.action === "stop" ? (
        <VmShutdownModal vm={dialogVm} onCancel={closeDialog} onSubmitted={closeDialog} />
      ) : (
        <VmCreateSnapshotModal vm={dialogVm} onCancel={closeDialog} onSubmitted={closeDialog} />
      )
    ) : null;
  return { actions, dialogNode };
}
