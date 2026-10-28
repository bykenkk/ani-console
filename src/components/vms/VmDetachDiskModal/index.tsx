import { Alert, Checkbox, Form, Modal } from "@arco-design/web-react";
import { detachVmDisk, type VirtualMachine, type VmDisk } from "@/api/vms";
import { useVmResourceMutation } from "@/hooks/useVmResourceMutation";
import { validateForm } from "@/lib/form";
import { vmIsClosed } from "@/lib/vms";

type VmDetachDiskModalProps = {
  vm: VirtualMachine;
  disk: VmDisk;
  onCancel: () => void;
  onSubmitted: () => void;
};
type VmDetachDiskFormValues = { guestPrepared: boolean };

export default function VmDetachDiskModal({
  vm,
  disk,
  onCancel,
  onSubmitted,
}: VmDetachDiskModalProps) {
  const [form] = Form.useForm<VmDetachDiskFormValues>();
  const mutation = useVmResourceMutation<VmDetachDiskFormValues>({
    vmId: vm.id,
    action: "卸载数据盘",
    actionId: "vm-disk-detach",
    onSubmitted,
    mutationFn: (values) =>
      detachVmDisk(vm.id, disk.diskId, {
        expected_version: vm.version,
        guest_prepared_confirmation: values.guestPrepared,
      }),
  });
  return (
    <Modal
      visible
      title={`卸载数据盘 · ${disk.name || disk.diskId}`}
      confirmLoading={mutation.isPending}
      okButtonProps={{
        status: "danger",
        disabled: vmIsClosed(vm) || mutation.busy || !disk.attached,
      }}
      onCancel={onCancel}
      onOk={async () => {
        if (mutation.busy || vmIsClosed(vm) || !disk.attached) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Alert
        type="warning"
        content={`将从 ${vm.name} 卸载磁盘 ${disk.diskId}。请先在客户机内停止使用并卸载文件系统，避免数据损坏。`}
      />
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          field="guestPrepared"
          triggerPropName="checked"
          rules={[
            {
              validator: (value, callback) => {
                if (value !== true) callback("请确认已完成客户机内的卸载准备");
              },
            },
          ]}
        >
          <Checkbox>已在客户机内完成卸载准备</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
