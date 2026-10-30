import { Form, Input, InputNumber, Modal, Typography } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNetworkEip, type CreateNetworkEipInput } from "@/api/network";
import { validateForm } from "@/lib/form";
import SecurityGroupSelect from "@/components/security-groups/SecurityGroupSelect";

type CreateEipModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

type CreateEipFormValues = {
  name: string;
  description?: string;
  security_group_ids: string[];
};

export default function CreateEipModal({ onCancel, onCreated }: CreateEipModalProps) {
  const [form] = Form.useForm<CreateEipFormValues>();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (input: CreateNetworkEipInput) => createNetworkEip(input),
    meta: {
      feedback: {
        channel: "message",
        action: "创建公网 IP",
        successText: "公网 IP 创建已提交",
        errorFallback: "创建失败，请稍后重试",
      },
    },
    onSuccess: async () => {
      // TODO: 资源 task 跟踪统一开放后接入创建进度；当前仅刷新列表。
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["network-eips"] }),
        queryClient.invalidateQueries({ queryKey: ["network-security-groups"] }),
        queryClient.invalidateQueries({ queryKey: ["network-security-group-bindings"] }),
      ]);
      onCreated();
    },
  });
  return (
    <Modal
      visible
      title="创建公网 IP"
      style={{ width: 640, maxWidth: "calc(100vw - 32px)" }}
      onCancel={onCancel}
      okText="创建"
      confirmLoading={create.isPending}
      closable={!create.isPending}
      maskClosable={!create.isPending}
      escToExit={!create.isPending}
      cancelButtonProps={{ disabled: create.isPending }}
      onOk={async () => {
        if (create.isPending) return;
        const values = await validateForm<CreateEipFormValues>(form);
        await create.mutateAsync({
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          security_group_ids: values.security_group_ids ?? [],
        });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ security_group_ids: [] }}
        disabled={create.isPending}
      >
        <Form.Item
          label="名称"
          field="name"
          rules={[
            { required: true, message: "请输入公网 IP 名称" },
            {
              validator: (value, callback) => {
                callback(value?.trim() ? undefined : "请输入公网 IP 名称");
              },
            },
          ]}
        >
          <Input placeholder="请输入名称" maxLength={64} showWordLimit />
        </Form.Item>
        <Form.Item label="简介" field="description">
          <Input.TextArea
            placeholder="请输入简介"
            maxLength={100}
            showWordLimit
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
        <Form.Item
          label="安全组"
          field="security_group_ids"
          extra="可多选；创建公网 IP 时一并绑定。"
        >
          <SecurityGroupSelect disabled={create.isPending} />
        </Form.Item>
        {/* TODO: EIP 创建契约提供带宽字段后接入上下行带宽配置。 */}
        <Typography.Paragraph type="secondary">上下行带宽暂不支持配置。</Typography.Paragraph>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="上行带宽">
            <InputNumber disabled placeholder="暂不可配置" suffix="Mbps" aria-label="上行带宽" />
          </Form.Item>
          <Form.Item label="下行带宽">
            <InputNumber disabled placeholder="暂不可配置" suffix="Mbps" aria-label="下行带宽" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
