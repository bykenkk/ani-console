// FIXME(governance-migration): 镜像更新未对齐，保留原弹窗、入口、参数和 legacy 调用。
// TODO(governance-migration): 待等价契约可用后迁移镜像更新，不混用新创建/启停接口替代。
import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances/legacy";
import { Form, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import InstanceRegistryImageSelect from "@/components/instances/InstanceRegistryImageSelect";

import { validateForm } from "@/lib/form";

type Instance = InstanceRecord;

export default function GpuContainerUpdateImageModal({
  instance,
  onCancel,
  onSubmitted,
}: {
  instance: Instance;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [form] = Form.useForm<{ imageId: string }>();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "操作",
        successText: "更新镜像已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async ({ imageId }: { imageId: string }) => {
      const submitData = {
        action: "update_image" as const,
        image_id: imageId,
        strategy: "rolling" as const,
      };
      await applyInstanceLifecycle(instance.id, submitData);
    },
    onSuccess: () => {
      onSubmitted();
    },
  });
  return (
    <Modal
      title={`更新镜像 · ${instance.name}`}
      visible
      confirmLoading={mutation.isPending}
      onCancel={() => {
        onCancel();
      }}
      onOk={async () => mutation.mutate(await validateForm(form))}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <InstanceRegistryImageSelect field="imageId" enabled instanceKind="gpu_container" />
      </Form>
    </Modal>
  );
}
