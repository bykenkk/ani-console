import { Checkbox, Form, Input, Modal } from "@arco-design/web-react";
import { createVmSnapshot, type VirtualMachine } from "@/api/vms";
import { useVmResourceMutation } from "@/hooks/useVmResourceMutation";
import { validateForm } from "@/lib/form";
import { vmIsClosed } from "@/lib/vms";

type VmCreateSnapshotModalProps = {
  vm: VirtualMachine;
  onCancel: () => void;
  onSubmitted: () => void;
};
type VmCreateSnapshotFormValues = { name: string };

export default function VmCreateSnapshotModal({
  vm,
  onCancel,
  onSubmitted,
}: VmCreateSnapshotModalProps) {
  const [form] = Form.useForm<VmCreateSnapshotFormValues>();
  const mutation = useVmResourceMutation<VmCreateSnapshotFormValues>({
    vmId: vm.id,
    action: "创建快照",
    actionId: "vm-snapshot-create",
    onSubmitted,
    mutationFn: (values) =>
      createVmSnapshot(vm.id, { expected_version: vm.version, name: values.name.trim() }),
  });
  return (
    <Modal
      visible
      title={`创建快照 · ${vm.name}`}
      onCancel={onCancel}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: vmIsClosed(vm) || mutation.busy }}
      onOk={async () => {
        if (mutation.busy || vmIsClosed(vm)) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          field="name"
          label="快照名称"
          rules={[
            { required: true, message: "请输入快照名称" },
            {
              validator: (value, callback) => {
                if (!value?.trim()) callback("请输入快照名称");
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
        {/* TODO(vm-snapshot-selection): 新契约不支持选择是否包含数据盘，补齐后恢复选择及提交。 */}
        <Form.Item label="快照范围" extra="暂不支持配置是否包含数据盘，实际范围以快照详情为准。">
          <Checkbox disabled>包含数据盘</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
