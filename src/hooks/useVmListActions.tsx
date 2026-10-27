import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startVm, stopVm, restartVm, forceStopVm, deleteVm, type VirtualMachine } from "@/api/vms";
import type { RowAction } from "@/components/common";
import { openVmVncWindow, vmIsClosed } from "@/lib/vms";
import { withId } from "@/lib/id";

type VmPowerAction = "start" | "stop" | "restart" | "force-stop" | "delete";
const LABELS: Record<VmPowerAction, string> = {
  start: "开机",
  stop: "关机",
  restart: "重启",
  "force-stop": "强制关机",
  delete: "删除云主机",
};
export function useVmListActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ action, vm }: { action: VmPowerAction; vm: VirtualMachine }) => {
      const input = { expected_version: vm.version };
      if (action === "force-stop")
        await forceStopVm(vm.id, { ...input, destructive_confirmation: true });
      else
        await { start: startVm, stop: stopVm, restart: restartVm, delete: deleteVm }[action](
          vm.id,
          input,
        );
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
      if (action === "delete") {
        await qc.invalidateQueries({ queryKey: ["vms", vm.id], refetchType: "none" });
        onDeleted?.();
        await qc.invalidateQueries({ queryKey: ["vms", "list"] });
      } else await qc.invalidateQueries({ queryKey: ["vms"] });
    },
  });
  const confirm = (action: VmPowerAction, vm: VirtualMachine) => {
    Modal.confirm({
      title: `${LABELS[action]} ${vm.name}`,
      content:
        action === "delete"
          ? "将删除该云主机及其自有磁盘、介质副本和快照。此操作不可撤销。"
          : action === "force-stop"
            ? "将立即断电，可能丢失尚未写入磁盘的数据。确认强制关机？"
            : `确认${LABELS[action]}该云主机？`,
      okButtonProps: {
        status: action === "delete" || action === "force-stop" ? "danger" : "default",
      },
      onOk: () => mutation.mutateAsync({ action, vm }),
    });
  };
  const actions: RowAction<VirtualMachine>[] = [
    {
      key: "console",
      label: "VNC 控制台",
      disabled: (vm) => vmIsClosed(vm) || vm.observedState !== "Running",
      onClick: (vm) => openVmVncWindow(vm.id),
    },
    ...(["start", "stop", "restart", "force-stop", "delete"] as const).map(
      (action): RowAction<VirtualMachine> => ({
        key: action,
        label: LABELS[action],
        intent: action === "delete" || action === "force-stop" ? "danger" : undefined,
        disabled: (vm) =>
          vmIsClosed(vm) ||
          mutation.isPending ||
          (action === "start"
            ? vm.observedState === "Running"
            : action === "stop" || action === "restart"
              ? vm.observedState !== "Running"
              : false),
        onClick: (vm) => confirm(action, vm),
      }),
    ),
  ];
  return { actions };
}
