import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { InferenceService } from "@/api/inference";
import { getInferenceKeyUnavailableReason, listModelInferenceKeys } from "@/api/inference-keys";
import { withFirst100 } from "@/api/pagination";

type InferenceInvocationFieldsProps = {
  service: InferenceService;
  onKeyChange: () => void;
};

const listKeyOptions = withFirst100(listModelInferenceKeys);

export default function InferenceInvocationFields({
  service,
  onKeyChange,
}: InferenceInvocationFieldsProps) {
  const { form, disabled } = Form.useFormContext();
  const keys = useQuery({
    queryKey: ["governance-inference-keys", "options", service.served_model_name],
    queryFn: ({ signal }) => listKeyOptions({ modelName: service.served_model_name }, signal),
    enabled: Boolean(service.served_model_name.trim()),
    gcTime: 0,
    meta: { errorNotification: { id: "inference-keys", action: "模型 API Key 列表加载" } },
  });

  useEffect(() => {
    form.setFieldValue("keyId", undefined);
  }, [form, service.served_model_name]);

  useEffect(() => {
    if (disabled) return;
    const selected = keys.data?.items.find((key) => key.id === form.getFieldValue("keyId"));
    if (selected && !getInferenceKeyUnavailableReason(selected)) return;
    const firstAvailable = keys.data?.items.find((key) => !getInferenceKeyUnavailableReason(key));
    form.setFieldValue("keyId", firstAvailable?.id);
  }, [disabled, form, keys.data, service.served_model_name]);

  return (
    <Form.Item
      field="keyId"
      style={{ width: 280, maxWidth: "100%", marginBottom: 0 }}
      rules={[
        { required: true, message: "请选择 API Key" },
        {
          validator: (id: string | undefined, callback) => {
            if (!id) return callback();
            const key = keys.data?.items.find((item) => item.id === id);
            callback(key ? getInferenceKeyUnavailableReason(key) : "请选择可用的 API Key");
          },
        },
      ]}
    >
      <Select
        aria-label="API Key"
        placeholder="请选择 API Key"
        showSearch={false}
        filterOption={false}
        loading={keys.isFetching}
        onChange={onKeyChange}
        // TODO(inference-key-model-filter):
        // 已按发布环境接入 served_model_name；待后端源码提交后核对正式契约，
        // 并联调确认权限范围、有效状态、筛选后 total 与分页语义。
        // 不将未筛选的管理列表视为模型可用 AK 列表，不使用前端筛选补偿。
        options={(keys.data?.items ?? []).map((key) => ({
          value: key.id,
          label: key.name,
          disabled: Boolean(getInferenceKeyUnavailableReason(key)),
        }))}
      />
    </Form.Item>
  );
}
