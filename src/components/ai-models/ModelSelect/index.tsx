import { withFirst100 } from "@/api/pagination";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listModels } from "@/api/models";
import type { ModelSelectProps } from "./types";

const listModelOptions = withFirst100(listModels);

export default function ModelSelect({ value, onChange, disabled }: ModelSelectProps) {
  // FIXME(model-contract): 用户确认保留原分支模型列表，尚未与当前后端索引对齐。
  // TODO(model-contract): 目标版本确认后验证模型选项及初始选择回显。
  const models = useQuery({
    queryKey: ["governance-models", "options"],
    queryFn: ({ signal }) => listModelOptions({}, signal),
    meta: { errorNotification: { id: "inference-models", action: "模型列表加载" } },
  });
  return (
    <Select
      aria-label="模型"
      value={value || undefined}
      disabled={disabled}
      loading={models.isFetching}
      showSearch
      placeholder="请选择已就绪的模型"
      options={[
        ...(value && !models.data?.items?.some((item) => item.id === value)
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

export type { ModelSelectProps } from "./types";
export type { ModelVersionSelectProps } from "./ModelVersionSelect";
