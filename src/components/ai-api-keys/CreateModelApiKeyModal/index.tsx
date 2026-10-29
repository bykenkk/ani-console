import { useRef } from "react";
import { DatePicker, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInferenceKey, type InferenceKeyCredentials } from "@/api/inference-keys";
import { formatIsoDateTime, isDateTimeExpired, isValidDateTime } from "@/lib/date";
import { validateForm } from "@/lib/form";
import ModelApiKeyPolicyField from "../ModelApiKeyPolicyField";

type CreateModelApiKeyModalProps = {
  onCancel: () => void;
  onCreated: (credentials: InferenceKeyCredentials) => void;
};

interface CreateModelApiKeyFormValues {
  name: string;
  policy_id: string;
  expires_on?: string;
}

export default function CreateModelApiKeyModal({
  onCancel,
  onCreated,
}: CreateModelApiKeyModalProps) {
  const [form] = Form.useForm<CreateModelApiKeyFormValues>();
  const submitting = useRef(false);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (values: CreateModelApiKeyFormValues) =>
      createInferenceKey({
        name: values.name.trim(),
        policy_id: values.policy_id,
        expires_at: values.expires_on
          ? formatIsoDateTime(`${values.expires_on}T23:59:59`)
          : undefined,
      }),
    meta: {
      feedback: {
        channel: "message",
        action: "创建模型 API Key",
        successText: "模型 API Key 已创建",
        errorFallback: "创建模型 API Key 失败",
      },
    },
    onSuccess: (credentials) => {
      onCreated(credentials);
      return Promise.all([
        qc.invalidateQueries({
          queryKey: ["governance-inference-keys"],
          predicate: (query) => query.queryKey[1] !== "options",
        }),
        qc.resetQueries({ queryKey: ["governance-inference-keys", "options"] }),
      ]);
    },
  });

  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<CreateModelApiKeyFormValues>(form);
      await create.mutateAsync(values);
    } catch {
      // 字段校验与请求错误由统一反馈入口处理，保留表单便于修正或重试。
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal
      visible
      title="创建模型 API Key"
      okText="创建"
      onOk={submit}
      onCancel={() => {
        if (!submitting.current) onCancel();
      }}
      confirmLoading={create.isPending}
      closable={!create.isPending}
      escToExit={!create.isPending}
      maskClosable={false}
      cancelButtonProps={{ disabled: create.isPending }}
      style={{ width: 680, maxWidth: "calc(100vw - 48px)" }}
    >
      <Form form={form} layout="vertical" disabled={create.isPending} autoComplete="off">
        <Form.Item
          field="name"
          label="名称"
          rules={[
            { required: true, match: /\S/, message: "请输入模型 API Key 名称" },
            {
              validator: (value: string | undefined, callback) =>
                callback(
                  value && new Blob([value.trim()]).size > 256
                    ? "名称不能超过 256 字节"
                    : undefined,
                ),
            },
          ]}
        >
          <Input placeholder="请输入模型 API Key 名称" maxLength={256} />
        </Form.Item>
        <ModelApiKeyPolicyField disabled={create.isPending} showRules={false} />
        <Form.Item
          field="expires_on"
          label="过期日期"
          extra="留空永不过期"
          rules={[
            {
              validator: (value: string | undefined, callback) =>
                callback(
                  value && (!isValidDateTime(value) || isDateTimeExpired(`${value}T23:59:59`))
                    ? "请选择今天或之后的日期"
                    : undefined,
                ),
            },
          ]}
        >
          <DatePicker allowClear className="w-full" placeholder="请选择过期日期" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
