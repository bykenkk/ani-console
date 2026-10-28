import { useState } from "react";
import { Alert, Checkbox, Modal, Space } from "@arco-design/web-react";
import { forceStopVm, stopVm, type VirtualMachine } from "@/api/vms";
import { useVmResourceMutation } from "@/hooks/useVmResourceMutation";
import { vmIsClosed } from "@/lib/vms";

type VmShutdownModalProps = {
  vm: VirtualMachine;
  onCancel: () => void;
  onSubmitted: () => void;
};

export default function VmShutdownModal({ vm, onCancel, onSubmitted }: VmShutdownModalProps) {
  const [force, setForce] = useState(false);
  const [confirmedVersion, setConfirmedVersion] = useState<string>();
  const mutation = useVmResourceMutation({
    vmId: vm.id,
    action: force ? "强制关机" : "关机",
    actionId: force ? "vm-force-stop" : "vm-stop",
    onSubmitted,
    onConflict: () => setConfirmedVersion(undefined),
    mutationFn: () =>
      force
        ? forceStopVm(vm.id, { expected_version: vm.version, destructive_confirmation: true })
        : stopVm(vm.id, { expected_version: vm.version }),
  });
  const disabled =
    vmIsClosed(vm) ||
    mutation.busy ||
    (force ? confirmedVersion !== vm.version : vm.observedState !== "Running");
  return (
    <Modal
      visible
      title={`关机 · ${vm.name}`}
      onCancel={onCancel}
      okText={force ? "确认强制关机" : "确认关机"}
      confirmLoading={mutation.isPending}
      okButtonProps={{ status: force ? "danger" : "default", disabled }}
      onOk={async () => {
        if (disabled) return;
        await mutation.mutateAsync();
      }}
    >
      <Space direction="vertical" size={16} className="w-full">
        <div>
          确定关闭「{vm.name}」（{vm.id}）？
        </div>
        <Checkbox
          checked={force}
          disabled={mutation.busy}
          onChange={(checked) => {
            setForce(checked);
            setConfirmedVersion(undefined);
          }}
        >
          强制关机
        </Checkbox>
        {force && (
          <>
            <Alert type="warning" content="强制关机将立即断电，可能丢失尚未写入磁盘的数据。" />
            <Checkbox
              checked={confirmedVersion === vm.version}
              disabled={mutation.busy}
              onChange={(checked) => setConfirmedVersion(checked ? vm.version : undefined)}
            >
              已了解数据丢失风险，确认强制关机
            </Checkbox>
          </>
        )}
      </Space>
    </Modal>
  );
}
