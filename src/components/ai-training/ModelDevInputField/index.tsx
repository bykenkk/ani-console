import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listModelDevInputVersions, type ModelDevInputVersion } from "@/api/modeldev";
import { withFirst100 } from "@/api/pagination";
import { formatModelDevInputVersion } from "@/lib/modeldev";

const listOptions = withFirst100(listModelDevInputVersions);
type ModelDevInputFieldProps = {
  field: string;
  onSelect: (version: ModelDevInputVersion | undefined) => void;
};

export default function ModelDevInputField({ field, onSelect }: ModelDevInputFieldProps) {
  const query = useQuery({
    queryKey: ["training-inputs", "options", { state: "READY" }],
    queryFn: ({ signal }) => listOptions({ state: "READY" }, signal),
    meta: {
      errorNotification: {
        id: "training-inputs",
        action: "训练数据集加载",
        fallback: "请稍后重试",
      },
    },
  });
  // TODO(modeldev-input): 目录仅支持 state；格式与所选实现的兼容性须由正式创建校验确认，不按前端演示 stage 过滤。
  return (
    <Form.Item
      field={field}
      label="数据集版本"
      formatter={(value) => value || undefined}
      rules={[{ required: true, message: "请选择数据集版本" }]}
    >
      <Select
        placeholder="请选择数据集版本"
        filterOption={false}
        loading={query.isFetching}
        options={(query.data?.items ?? []).map((item) => ({
          value: item.input_version_id,
          label: formatModelDevInputVersion(item),
        }))}
        onChange={(id) => onSelect(query.data?.items.find((item) => item.input_version_id === id))}
      />
    </Form.Item>
  );
}
