// FIXME(governance-migration): 发布回滚未对齐，保留原弹窗、入口、参数和 legacy 调用。
// TODO(governance-migration): 待等价契约可用后迁移发布回滚，不混用新创建/启停接口替代。
import { type InstanceRecord, applyInstanceLifecycle } from "@/api/instances/legacy";
import { Form, Modal, Select, Tooltip } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";

import { validateForm } from "@/lib/form";
import { getImageDisplayName } from "@/lib/render";

type ContainerRollbackFormValues = { revision: string };

type ContainerRollbackModalProps = {
  instance: Instance;
  onCancel: () => void;
  onSubmitted: () => void;
};

type Instance = InstanceRecord;

export default function ContainerRollbackModal({
  instance,
  onCancel,
  onSubmitted,
}: ContainerRollbackModalProps) {
  const [form] = Form.useForm<ContainerRollbackFormValues>();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "操作",
        successText: "回滚发布已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async ({ revision }: ContainerRollbackFormValues) => {
      const submitData = { action: "rollback" as const, revision };
      await applyInstanceLifecycle(instance.id, submitData);
    },
    onSuccess: () => {
      onSubmitted();
    },
  });
  const targets = (instance.container?.history ?? []).filter(
    (entry) => entry.revision !== instance.container?.revision,
  );
  const cancel = () => {
    onCancel();
  };

  return (
    <Modal
      title={`回滚发布 · ${instance.name}`}
      visible
      confirmLoading={mutation.isPending}
      onCancel={cancel}
      onOk={async () => mutation.mutate(await validateForm(form))}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item
          field="revision"
          label="目标修订版本"
          rules={[{ required: true, message: "请选择修订版本" }]}
        >
          <Select placeholder="请选择历史修订版本">
            {targets.map((entry) => (
              <Select.Option key={entry.revision} value={entry.revision}>
                <Tooltip
                  content={entry.image ? `${entry.revision} · ${entry.image}` : entry.revision}
                >
                  <span className="block truncate">
                    {entry.revision}
                    {entry.image ? ` · ${getImageDisplayName(entry.image)}` : ""}
                  </span>
                </Tooltip>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
