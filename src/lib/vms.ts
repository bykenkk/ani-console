import type { VirtualMachine } from "@/api/vms";

export function vmIsClosed(vm: VirtualMachine) {
  return (
    vm.closing ||
    vm.version === "0" ||
    vm.observedState === "Deleted" ||
    vm.observedState === "canceled"
  );
}

export function vmCloneIsPreparing(vm: VirtualMachine) {
  if (vm.sourceKind !== "VM_CLONE" || vmIsClosed(vm)) return false;
  return (
    vm.observedState.toLowerCase() === "unknown" ||
    (vm.observedState === "Stopped" &&
      (!vm.disks.length || vm.disks.some((disk) => disk.preparationState !== "Bound")))
  );
}

export function vmCloneCanStart(vm: VirtualMachine) {
  return (
    !vmIsClosed(vm) &&
    vm.desiredState === "Stopped" &&
    vm.observedState === "Stopped" &&
    vm.disks.length > 0 &&
    vm.disks.every((disk) => disk.preparationState === "Bound")
  );
}
