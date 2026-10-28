import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listInferenceServices } from "@/api/inference";
import { withFirst100 } from "@/api/pagination";

export interface ModelApiKeyScope {
  modelNames: string[];
}

type ModelApiKeyScopeFieldProps = { disabled?: boolean };
type ModelApiKeyScopeInputProps = {
  value?: ModelApiKeyScope;
  onChange?: (value: ModelApiKeyScope) => void;
  disabled?: boolean;
};

const listServiceOptions = withFirst100(listInferenceServices);

function ModelApiKeyScopeInput({
  value = { modelNames: [] },
  onChange,
  disabled,
}: ModelApiKeyScopeInputProps) {
  const services = useQuery({
    queryKey: ["governance-inference-services", "options"],
    queryFn: ({ signal }) => listServiceOptions({}, signal),
    meta: {
      errorNotification: { id: "inference-services", action: "推理服务列表加载" },
    },
  });

  return (
    <Select
      aria-label="授权模型"
      mode="multiple"
      placeholder="请选择授权模型"
      allowClear
      showSearch={false}
      filterOption={false}
      disabled={disabled}
      loading={services.isFetching}
      value={value.modelNames}
      options={Array.from(
        new Set((services.data?.items ?? []).map((service) => service.served_model_name)),
      )}
      onChange={(modelNames) => onChange?.({ modelNames })}
    />
  );
}

export default function ModelApiKeyScopeField({ disabled }: ModelApiKeyScopeFieldProps) {
  return (
    <Form.Item
      field="scope"
      label="授权模型"
      rules={[
        {
          validator: (value: ModelApiKeyScope | undefined, callback) => {
            if (!value?.modelNames.length) {
              callback("请选择至少一个授权模型");
              return;
            }
            if (value.modelNames.some((name) => !name.trim() || new Blob([name]).size > 256)) {
              callback("模型名不能为空，且每项不能超过 256 字节");
              return;
            }
            callback();
          },
        },
      ]}
    >
      <ModelApiKeyScopeInput disabled={disabled} />
    </Form.Item>
  );
}
