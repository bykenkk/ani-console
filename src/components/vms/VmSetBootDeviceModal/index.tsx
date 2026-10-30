import { Alert, Form, Modal, Select } from "@arco-design/web-react";
import { setVmBootDevice, type VirtualMachine, type VmBootDevice } from "@/api/vms";
import { useVMMutation } from "@/hooks/useVMMutation";
import { validateForm } from "@/lib/form";
import { vmIsClosed } from "@/lib/vms";

type VmSetBootDeviceModalProps = {
  vm: VirtualMachine;
  onCancel: () => void;
  onSubmitted: () => void;
};
type VmSetBootDeviceFormValues = { bootDevice: VmBootDevice };

export default function VmSetBootDeviceModal({
  vm,
  onCancel,
  onSubmitted,
}: VmSetBootDeviceModalProps) {
  const [form] = Form.useForm<VmSetBootDeviceFormValues>();
  const mutation = useVMMutation<VmSetBootDeviceFormValues>({
    vmId: vm.id,
    action: "切换启动设备",
    actionId: "vm-boot",
    onSubmitted,
    mutationFn: (values) =>
      setVmBootDevice(vm.id, { expected_version: vm.version, boot_device: values.bootDevice }),
  });
  return (
    <Modal
      visible
      title={`切换启动设备 · ${vm.name}`}
      onCancel={onCancel}
      confirmLoading={mutation.isPending}
      okText="确认切换"
      okButtonProps={{ disabled: vmIsClosed(vm) || mutation.busy }}
      onOk={async () => {
        if (mutation.busy || vmIsClosed(vm)) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Alert
        type="warning"
        content="选择下次启动时使用的设备。安装系统时选择系统安装光盘（ISO），安装完成后切回系统盘。请先确认已插入可启动的安装光盘；本操作不会自动重启云主机。"
      />
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{ bootDevice: vm.bootDevice }}
      >
        <Form.Item
          field="bootDevice"
          label="下次启动设备"
          rules={[{ required: true, message: "请选择启动设备" }]}
        >
          <Select
            options={[
              { value: "SYSTEM_DISK", label: "系统盘" },
              { value: "INSTALL_MEDIA", label: "系统安装光盘（ISO）" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
