import { createApiKey, type ApiKeyCredentials } from "@/api/api-keys";
import { ApiKeyRoleField } from "@/components/api-keys/ApiKeyRoleField";
import { formatIsoDateTime } from "@/lib/date";
import { validateForm } from "@/lib/form";
import { DatePicker, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateApiKeyFormValues {
  name: string;
  role_id: number;
  expires_on?: string;
}

export function CreateApiKeyModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (credentials: ApiKeyCredentials) => void;
}) {
  const [form] = Form.useForm<CreateApiKeyFormValues>();
  const queryClient = useQueryClient();
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建 API Key",
        successText: "API Key 已创建，请立即保存密钥",
        errorFallback: "创建 API Key 失败",
      },
    },
    mutationFn: (values: CreateApiKeyFormValues) =>
      createApiKey({
        name: values.name.trim(),
        role_id: values.role_id,
        expires_at: values.expires_on
          ? formatIsoDateTime(`${values.expires_on}T23:59:59`)
          : undefined,
      }),
    onSuccess: (credentials) => {
      onCancel();
      onCreated(credentials);
      return queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  return (
    <Modal
      visible
      title="创建 API Key"
      confirmLoading={create.isPending}
      onCancel={onCancel}
      onOk={() =>
        validateForm<CreateApiKeyFormValues>(form).then((values) => create.mutateAsync(values))
      }
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="名称"
          field="name"
          rules={[
            { required: true, match: /\S/, message: "请输入 API Key 名称" },
            { maxLength: 128, message: "名称不能超过 128 个字符" },
          ]}
        >
          <Input placeholder="例如：ci-bot" maxLength={128} showWordLimit />
        </Form.Item>
        <ApiKeyRoleField />
        <Form.Item label="过期时间" field="expires_on" extra="不选则永久有效；所选日期结束时过期。">
          <DatePicker allowClear className="w-full" placeholder="请选择过期日期" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
