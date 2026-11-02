import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import {
  listModelDevInputVersions,
  type ModelDevInputVersion,
  type ModelDevInputVersionListParams,
} from "@/api/modeldev";
import { withFirst100 } from "@/api/pagination";
import { formatModelDevInputVersion } from "@/lib/modeldev";

const listOptions = withFirst100(listModelDevInputVersions);
type ModelDevInputFieldProps = {
  field: string;
  format: NonNullable<ModelDevInputVersionListParams["format"]>;
  onSelect: (version: ModelDevInputVersion | undefined) => void;
};

export default function ModelDevInputField({ field, format, onSelect }: ModelDevInputFieldProps) {
  const query = useQuery({
    queryKey: ["training-inputs", "options", { state: "READY", format }],
    queryFn: ({ signal }) => listOptions({ state: "READY", format }, signal),
    meta: {
      errorNotification: {
        id: "training-inputs",
        action: "训练数据集加载",
        fallback: "请稍后重试",
      },
    },
  });
  // TODO(modeldev-input): 联调核对 READY 与 CSV/JSON 格式组合筛选。
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
