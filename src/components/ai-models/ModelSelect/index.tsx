import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listModels } from "@/api/models";

interface ModelSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function ModelSelect({ value, onChange, disabled }: ModelSelectProps) {
  const [keyword, setKeyword] = useState("");
  // TODO(pagination-migration): 当前游标接口仅取首批 100 项；正式页码契约开放后改用 withFirst100，不自动遍历后续游标。
  // TODO(model-contract): 联调模型选项的远程搜索及初始选择回显。
  const models = useQuery({
    queryKey: ["governance-models", "options", { keyword }],
    queryFn: ({ signal }) => listModels({ limit: 100, keyword: keyword || undefined }, signal),
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
        ...(value && !models.data?.models?.some((item) => item.id === value)
          ? [{ value, label: value }]
          : []),
        ...(models.data?.models ?? []).map((item) => ({
          value: item.id,
          label: item.display_name || item.name,
        })),
      ]}
      onChange={onChange}
    />
  );
}

export { default as ModelVersionSelect } from "./ModelVersionSelect";
