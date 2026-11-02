import { useEffect } from "react";
import { Form, Select } from "@arco-design/web-react";
import { skipToken, useQuery } from "@tanstack/react-query";
import {
  listModelDevImplementations,
  type ModelDevImplementation,
  type ModelDevImplementationListParams,
} from "@/api/modeldev";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

const listOptions = withFirst100(listModelDevImplementations);
type ModelDevImplementationFieldProps = {
  field: string;
  kind: NonNullable<ModelDevImplementationListParams["kind"]>;
  deviceMode?: ModelDevImplementationListParams["device_mode"];
  selectedId: string;
  onResolve: (implementation: ModelDevImplementation | undefined) => void;
};

export default function ModelDevImplementationField({
  field,
  kind,
  deviceMode,
  selectedId,
  onResolve,
}: ModelDevImplementationFieldProps) {
  const { disabled } = Form.useFormContext();
  const label = kind === "FINETUNING" ? "微调技术" : "训练方法";
  const query = useQuery({
    queryKey: ["training-implementations", "options", { kind, device_mode: deviceMode }],
    queryFn: deviceMode
      ? ({ signal }) => listOptions({ kind, device_mode: deviceMode }, signal)
      : skipToken,
    meta: {
      errorNotification: {
        id: withId("training-implementations", kind),
        action: `${label}加载`,
        fallback: "请稍后重试",
      },
    },
  });
  const selected = query.data?.items.find(
    (item) => item.implementation_id === selectedId && item.kind === kind && item.available,
  );
  useEffect(() => {
    onResolve(selected);
  }, [onResolve, selected]);

  return (
    <Form.Item
      field={field}
      label={label}
      formatter={(value) => value || undefined}
      rules={[
        { required: true, message: `请选择${label}` },
        {
          validator: (value, callback) =>
            callback(
              value &&
                !query.data?.items.some(
                  (item) =>
                    item.implementation_id === value && item.kind === kind && item.available,
                )
                ? `请选择当前可用的${label}`
                : undefined,
            ),
        },
      ]}
    >
      <Select
        placeholder={deviceMode ? `请选择${label}` : "请先选择算力规格"}
        disabled={disabled || !deviceMode}
        loading={query.isFetching}
        filterOption={false}
        options={(query.data?.items ?? []).map((item) => ({
          value: item.implementation_id,
          label: item.name,
          // 后端负责筛选；不符合当前类型的异常返回不可选。
          disabled: !item.available || item.kind !== kind,
        }))}
      />
    </Form.Item>
  );
}
