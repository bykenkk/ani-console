import { createK8sCluster } from "@/api/k8s-clusters";
import { validateForm } from "@/lib/form";
import { Form, Input, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";

type CreateK8sClusterModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

type CreateK8sClusterFormValues = {
  name: string;
  version?: string;
};

export default function CreateK8sClusterModal({ onCancel, onCreated }: CreateK8sClusterModalProps) {
  const [form] = Form.useForm<CreateK8sClusterFormValues>();
  const createCluster = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建",
        errorFallback: "请求失败",
      },
    },
    mutationFn: (values: CreateK8sClusterFormValues) =>
      createK8sCluster({ name: values.name, version: values.version || undefined }),
    onSuccess: () => {
      onCreated();
      onCancel();
    },
  });

  return (
    <Modal
      visible
      title="创建集群"
      onCancel={onCancel}
      onOk={async () => createCluster.mutateAsync(await validateForm(form))}
      confirmLoading={createCluster.isPending}
      unmountOnExit
    >
      <Form form={form} layout="vertical" initialValues={{ version: "1.36.0" }}>
        <Form.Item
          field="name"
          label="名称"
          rules={[{ required: true, message: "请输入集群名称" }]}
        >
          <Input placeholder="集群名称" />
        </Form.Item>
        <Form.Item field="version" label="版本">
          <Input placeholder="1.36.0" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
