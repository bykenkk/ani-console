import { useEffect } from "react";
import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
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
  selectedId: string;
  onResolve: (implementation: ModelDevImplementation | undefined) => void;
};

export default function ModelDevImplementationField({
  field,
  kind,
  selectedId,
  onResolve,
}: ModelDevImplementationFieldProps) {
  const label = kind === "FINETUNING" ? "微调技术" : "训练方法";
  const query = useQuery({
    queryKey: ["training-implementations", "options", { kind }],
    // TODO(modeldev-kind): 待联调验证 GENERAL_TRAINING / FINETUNING 的筛选及空结果。
    queryFn: ({ signal }) => listOptions({ kind }, signal),
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
        placeholder={`请选择${label}`}
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
