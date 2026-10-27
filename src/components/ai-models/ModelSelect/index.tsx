import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listModels, type Model, type ModelListParams } from "@/api/models";
import { withFirst100 } from "@/api/pagination";

const listModelOptions = withFirst100(listModels);

interface ModelSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (model: Model | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  status?: ModelListParams["status"];
}

export default function ModelSelect({
  value,
  onChange,
  onSelect,
  placeholder = "请选择模型",
  disabled,
  status,
}: ModelSelectProps) {
  const [keyword, setKeyword] = useState("");
  // TODO(model-contract): 联调模型选项的远程搜索及初始选择回显。
  const models = useQuery({
    queryKey: ["governance-models", "options", { keyword, status }],
    queryFn: ({ signal }) => listModelOptions({ keyword: keyword || undefined, status }, signal),
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
      placeholder={placeholder}
      options={[
        ...(value && !models.data?.items.some((item) => item.id === value)
          ? [{ value, label: value }]
          : []),
        ...(models.data?.items ?? []).map((item) => ({
          value: item.id,
          label: item.name,
        })),
      ]}
      onChange={(id) => {
        onChange?.(id);
        onSelect?.(models.data?.items.find((item) => item.id === id));
      }}
    />
  );
}

export { default as ModelVersionSelect } from "./ModelVersionSelect";
