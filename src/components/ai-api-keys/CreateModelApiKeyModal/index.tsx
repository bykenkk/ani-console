import { useRef } from "react";
import { DatePicker, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInferenceKey, type InferenceKeyCredentials } from "@/api/inference-keys";
import { formatIsoDateTime, isDateTimeExpired, isValidDateTime } from "@/lib/date";
import { validateForm } from "@/lib/form";
import ModelApiKeyLimitField, { type ModelApiKeyLimit } from "../ModelApiKeyLimitField";
import ModelApiKeyScopeField, { type ModelApiKeyScope } from "../ModelApiKeyScopeField";

type CreateModelApiKeyModalProps = {
  onCancel: () => void;
  onCreated: (credentials: InferenceKeyCredentials) => void;
};

interface CreateModelApiKeyFormValues {
  name: string;
  scope: ModelApiKeyScope;
  requests_per_second: ModelApiKeyLimit;
  requests_per_minute: ModelApiKeyLimit;
  requests_per_hour: ModelApiKeyLimit;
  expires_on?: string;
}

const limitFields = [
  { field: "requests_per_second", label: "每秒请求上限" },
  { field: "requests_per_minute", label: "每分钟请求上限" },
  { field: "requests_per_hour", label: "每小时请求上限" },
] as const;

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
        allowed_service_ids: [],
        allowed_model_names: values.scope.modelNames,
        requests_per_second: values.requests_per_second.enabled
          ? values.requests_per_second.limit!
          : 0,
        requests_per_minute: values.requests_per_minute.enabled
          ? values.requests_per_minute.limit!
          : 0,
        requests_per_hour: values.requests_per_hour.enabled ? values.requests_per_hour.limit! : 0,
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
      return qc.invalidateQueries({ queryKey: ["governance-inference-keys"] });
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
      <Form
        form={form}
        layout="vertical"
        disabled={create.isPending}
        autoComplete="off"
        initialValues={{
          scope: { modelNames: [] },
          requests_per_second: { enabled: false },
          requests_per_minute: { enabled: false },
          requests_per_hour: { enabled: false },
        }}
      >
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
        <ModelApiKeyScopeField disabled={create.isPending} />
        {limitFields.map(({ field, label }) => (
          <ModelApiKeyLimitField
            key={field}
            field={field}
            label={label}
            disabled={create.isPending}
          />
        ))}
        <Form.Item
          field="expires_on"
          label="过期日期"
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
