import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances/legacy";
import { Checkbox, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";

import { validateForm } from "@/lib/form";

type VmSnapshotModalProps = {
  instance: Instance;
  onCancel: () => void;
  onSubmitted: (operationId: string) => void;
};

type Instance = InstanceRecord;
type VmSnapshotFormValues = { snapshotName: string; includeDataDisks?: boolean };

export default function VmSnapshotModal({ instance, onCancel, onSubmitted }: VmSnapshotModalProps) {
  const [form] = Form.useForm<VmSnapshotFormValues>();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "操作",
        successText: "创建快照已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async (values: VmSnapshotFormValues) => {
      const submitData = {
        action: "snapshot" as const,
        snapshot_name: values.snapshotName.trim(),
        include_data_disks: values.includeDataDisks ?? false,
      };
      const data = await applyInstanceLifecycle(instance.id, submitData);
      return data.operation_id;
    },
    onSuccess: (operationId) => {
      onSubmitted(operationId);
    },
  });
  return (
    <Modal
      title={`创建快照 · ${instance.name}`}
      visible
      confirmLoading={mutation.isPending}
      onCancel={() => {
        onCancel();
      }}
      onOk={async () => mutation.mutate(await validateForm(form))}
      unmountOnExit
    >
      <Form form={form} layout="vertical" initialValues={{ includeDataDisks: true }}>
        <Form.Item
          field="snapshotName"
          label="快照名称"
          rules={[{ required: true, message: "请输入快照名称" }]}
        >
          <Input placeholder="请输入快照名称" />
        </Form.Item>
        <Form.Item field="includeDataDisks" triggerPropName="checked">
          <Checkbox>包含数据盘</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
