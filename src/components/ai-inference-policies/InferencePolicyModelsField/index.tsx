import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listInferenceServices } from "@/api/inference";
import { withFirst100 } from "@/api/pagination";

export interface InferencePolicyModels {
  modelNames: string[];
}

type InferencePolicyModelsFieldProps = { disabled?: boolean };
type InferencePolicyModelsInputProps = {
  value?: InferencePolicyModels;
  onChange?: (value: InferencePolicyModels) => void;
  disabled?: boolean;
};

const listServiceOptions = withFirst100(listInferenceServices);

function InferencePolicyModelsInput({
  value = { modelNames: [] },
  onChange,
  disabled,
}: InferencePolicyModelsInputProps) {
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
        new Set([
          ...value.modelNames,
          ...(services.data?.items ?? []).map((service) => service.served_model_name),
        ]),
      )}
      onChange={(modelNames) => onChange?.({ modelNames })}
    />
  );
}

export default function InferencePolicyModelsField({ disabled }: InferencePolicyModelsFieldProps) {
  return (
    <Form.Item
      field="scope"
      label="授权模型"
      extra="未选择任何模型时，将拒绝全部模型调用"
      rules={[
        {
          validator: (value: InferencePolicyModels | undefined, callback) => {
            if (value?.modelNames.some((name) => !name.trim() || new Blob([name]).size > 256)) {
              callback("模型名不能为空，且每项不能超过 256 字节");
              return;
            }
            callback();
          },
        },
      ]}
    >
      <InferencePolicyModelsInput disabled={disabled} />
    </Form.Item>
  );
}
