import { openExternalUrl } from "@/lib/browser";
import { showMessage } from "@/lib/feedback";
import type { VirtualMachine } from "@/api/vms";

export function vmIsClosed(vm: VirtualMachine) {
  return (
    vm.closing ||
    vm.version === "0" ||
    vm.observedState === "Deleted" ||
    vm.observedState === "canceled"
  );
}
export function openVmVncWindow(id: string) {
  try {
    openExternalUrl(`/vnc?instanceId=${encodeURIComponent(id)}&kind=vm`);
  } catch (error) {
    showMessage({ type: "error", content: { error, fallback: "无法打开控制台" } });
  }
}
