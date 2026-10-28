import type { VirtualMachine } from "@/api/vms";

export function vmIsClosed(vm: VirtualMachine) {
  return (
    vm.closing ||
    vm.version === "0" ||
    vm.observedState === "Deleted" ||
    vm.observedState === "canceled"
  );
}
