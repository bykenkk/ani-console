import { Form, Input, InputNumber, Modal } from "@arco-design/web-react";
import { createVmDisk, type VirtualMachine } from "@/api/vms";
import { useVMMutation } from "@/hooks/useVMMutation";
import { validateForm } from "@/lib/form";
import { vmIsClosed } from "@/lib/vms";

type VmCreateDiskModalProps = { vm: VirtualMachine; onCancel: () => void; onSubmitted: () => void };
type VmCreateDiskFormValues = { name: string; sizeGb: number };

export default function VmCreateDiskModal({ vm, onCancel, onSubmitted }: VmCreateDiskModalProps) {
  const [form] = Form.useForm<VmCreateDiskFormValues>();
  const mutation = useVMMutation<VmCreateDiskFormValues>({
    vmId: vm.id,
    action: "创建数据盘",
    actionId: "vm-disk-create",
    onSubmitted,
    mutationFn: (values) =>
      createVmDisk(vm.id, {
        expected_version: vm.version,
        name: values.name.trim(),
        size_gb: String(values.sizeGb),
      }),
  });
  return (
    <Modal
      visible
      title={`创建数据盘 · ${vm.name}`}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: vmIsClosed(vm) || mutation.busy }}
      onCancel={onCancel}
      onOk={async () => {
        if (mutation.busy || vmIsClosed(vm)) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ sizeGb: 10 }}>
        <Form.Item
          field="name"
          label="名称"
          rules={[
            { required: true, message: "请输入数据盘名称" },
            {
              validator: (value, callback) => {
                if (!value?.trim()) callback("请输入数据盘名称");
              },
            },
          ]}
        >
          <Input maxLength={128} />
        </Form.Item>
        <Form.Item
          field="sizeGb"
          label="容量 (GB)"
          rules={[{ required: true, type: "number", min: 1, message: "请输入正整数容量" }]}
        >
          <InputNumber min={1} max={9223372036} precision={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
