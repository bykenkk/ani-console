import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { InferenceService } from "@/api/inference";
import {
  getInferenceKeyExclusionReason,
  getInferenceKeyUnavailableReason,
  listInferenceKeys,
} from "@/api/inference-keys";
import { withFirst100 } from "@/api/pagination";

type InferenceInvocationFieldsProps = {
  service: InferenceService;
  onKeyChange: () => void;
};

const listKeyOptions = withFirst100(listInferenceKeys);

export default function InferenceInvocationFields({
  service,
  onKeyChange,
}: InferenceInvocationFieldsProps) {
  const { form, disabled } = Form.useFormContext();
  const keys = useQuery({
    queryKey: ["governance-inference-keys", "options"],
    queryFn: ({ signal }) => listKeyOptions({}, signal),
    gcTime: 0,
    meta: { errorNotification: { id: "inference-keys", action: "模型 API Key 列表加载" } },
  });

  useEffect(() => {
    if (disabled || form.getFieldValue("keyId")) return;
    const firstAvailable = keys.data?.items.find(
      (key) => !getInferenceKeyUnavailableReason(key, service.served_model_name, service.id),
    );
    if (firstAvailable) form.setFieldValue("keyId", firstAvailable.id);
  }, [disabled, form, keys.data, service.id, service.served_model_name]);

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
            callback(
              key
                ? getInferenceKeyUnavailableReason(key, service.served_model_name, service.id)
                : "请选择可用的 API Key",
            );
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
        // TODO(inference-key-options): 按用户要求暂从前 100 项中排除失效及授权不匹配的 Key，待后端提供对应筛选后迁移。
        options={(keys.data?.items ?? [])
          .filter(
            (key) => !getInferenceKeyExclusionReason(key, service.served_model_name, service.id),
          )
          .map((key) => ({
            value: key.id,
            label: key.name,
            disabled: !key.secret?.trim(),
          }))}
      />
    </Form.Item>
  );
}
