// FIXME(governance-migration): 实例变配未对齐，保留原弹窗、入口、参数和 legacy 调用。
// TODO(governance-migration): 待等价契约可用后迁移实例变配，不混用新创建/启停接口替代。
import {
  applyInstanceLifecycle,
  type InstanceLifecycleInput,
  type InstanceRecord,
} from "@/api/instances/legacy";
import { Form, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import GpuContainerResizeFields from "@/components/gpu-containers/GpuContainerResizeFields";
import {
  buildGpuContainerResizeFields,
  getGpuContainerResizeInitialValues,
  isGpuContainerResizeUnchanged,
  type GpuContainerResizeFormValues,
} from "@/components/gpu-containers/GpuContainerResizeFields/helpers";

import { showMessage } from "@/lib/feedback";
import { validateForm } from "@/lib/form";

type Instance = InstanceRecord;

export default function GpuContainerResizeModal({
  instance,
  onCancel,
  onSubmitted,
}: {
  instance: Instance;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [form] = Form.useForm<GpuContainerResizeFormValues>();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "操作",
        successText: "变配已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async (values: GpuContainerResizeFormValues) => {
      const submitData = {
        action: "resize" as const,
        ...buildGpuContainerResizeFields(values),
      } satisfies InstanceLifecycleInput;
      await applyInstanceLifecycle(instance.id, submitData);
    },
    onSuccess: () => {
      onSubmitted();
    },
  });
  return (
    <Modal
      title={`变配 · ${instance.name}`}
      visible
      confirmLoading={mutation.isPending}
      okText="确认变配"
      onCancel={() => {
        onCancel();
      }}
      onOk={async () => {
        const values = await validateForm<GpuContainerResizeFormValues>(form);
        if (isGpuContainerResizeUnchanged(instance, values)) {
          showMessage({ type: "info", content: "规格未变化" });
          return;
        }
        mutation.mutate(values);
      }}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={getGpuContainerResizeInitialValues(instance)}
      >
        <GpuContainerResizeFields instance={instance} enabled />
      </Form>
    </Modal>
  );
}
