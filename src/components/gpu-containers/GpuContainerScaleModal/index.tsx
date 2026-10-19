// FIXME(governance-migration): 扩缩容未对齐，保留原弹窗、入口、参数和 legacy 调用。
// TODO(governance-migration): 待等价契约可用后迁移扩缩容，不混用新创建/启停接口替代。
import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances/legacy";
import { Form, InputNumber, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";

import { validateForm } from "@/lib/form";

type Instance = InstanceRecord;

export default function GpuContainerScaleModal({
  instance,
  onCancel,
  onSubmitted,
}: {
  instance: Instance;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [form] = Form.useForm<{ replicas: number }>();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "操作",
        successText: "扩缩容已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async ({ replicas }: { replicas: number }) => {
      const submitData = { action: "scale" as const, replicas };
      await applyInstanceLifecycle(instance.id, submitData);
    },
    onSuccess: () => {
      onSubmitted();
    },
  });
  return (
    <Modal
      title={`扩缩容 · ${instance.name}`}
      visible
      confirmLoading={mutation.isPending}
      onCancel={() => {
        onCancel();
      }}
      onOk={async () => mutation.mutate(await validateForm(form))}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ replicas: instance.container?.replicas ?? 1 }}
      >
        <Form.Item
          field="replicas"
          label="副本数"
          rules={[{ required: true, message: "请输入副本数" }]}
        >
          <InputNumber min={1} precision={0} className="w-full" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
