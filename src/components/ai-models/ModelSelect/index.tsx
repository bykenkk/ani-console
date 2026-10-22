import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listModels } from "@/api/models";
import { withFirst100 } from "@/api/pagination";

const listModelOptions = withFirst100(listModels);

interface ModelSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function ModelSelect({ value, onChange, disabled }: ModelSelectProps) {
  const [keyword, setKeyword] = useState("");
  // TODO(model-contract): 联调模型选项的远程搜索及初始选择回显。
  const models = useQuery({
    queryKey: ["governance-models", "options", { keyword }],
    queryFn: ({ signal }) => listModelOptions({ keyword: keyword || undefined }, signal),
    meta: { errorNotification: { id: "inference-models", action: "模型列表加载" } },
  });
  return (
    <Select
      aria-label="模型"
      value={value || undefined}
      disabled={disabled}
      loading={models.isFetching}
      showSearch
      filterOption={false}
      onSearch={setKeyword}
      placeholder="请选择已就绪的模型"
      options={[
        ...(value && !models.data?.items.some((item) => item.id === value)
          ? [{ value, label: value }]
          : []),
        ...(models.data?.items ?? []).map((item) => ({
          value: item.id,
          label: item.display_name || item.name,
        })),
      ]}
      onChange={onChange}
    />
  );
}

export { default as ModelVersionSelect } from "./ModelVersionSelect";
