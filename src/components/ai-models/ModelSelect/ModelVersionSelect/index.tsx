import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getModel, getModelVersion, listModelVersions, type ModelVersion } from "@/api/models";
import { withId } from "@/lib/id";

interface ModelVersionSelectProps {
  modelId: string;
  value?: string;
  onChange?: (value: string, version?: ModelVersion, modelName?: string) => void;
  disabled?: boolean;
}

export default function ModelVersionSelect({
  modelId,
  value,
  onChange,
  disabled,
}: ModelVersionSelectProps) {
  const appliedId = useRef("");
  const [chosenVersion, setChosenVersion] = useState<ModelVersion>();
  const model = useQuery({
    queryKey: ["governance-model", modelId],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => getModel(modelId, signal),
    meta: { errorNotification: { id: withId("inference-model", modelId), action: "模型详情加载" } },
  });
  // TODO(pagination-migration): 当前版本游标接口仅取首批 100 项；正式页码契约开放后改用 withFirst100，不自动遍历后续游标。
  // TODO(model-contract): 联调版本归属、就绪状态及初始选择回显。
  const versions = useQuery({
    queryKey: ["governance-model-versions", modelId, "options"],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => listModelVersions(modelId, { limit: 100 }, signal),
    meta: {
      errorNotification: { id: withId("inference-versions", modelId), action: "模型版本加载" },
    },
  });
  const selectedVersion = useQuery({
    queryKey: ["governance-model-version", value],
    enabled: Boolean(modelId && value),
    queryFn: ({ signal }) => getModelVersion(value!, signal),
    meta: { errorNotification: { id: withId("inference-version", value), action: "模型版本加载" } },
  });
  const items = [...(versions.data?.versions ?? [])];
  if (chosenVersion?.model_id === modelId && !items.some((item) => item.id === chosenVersion.id))
    items.push(chosenVersion);
  const loadedVersion = selectedVersion.data?.version;
  if (loadedVersion?.model_id === modelId && !items.some((item) => item.id === loadedVersion.id))
    items.push(loadedVersion);
  const selected = items.find((item) => item.id === value);
  useEffect(() => {
    if (value || !versions.data || !modelId || disabled) return;
    const firstReady = versions.data.versions?.find(
      (item) => item.status.toLowerCase() === "ready",
    );
    if (firstReady) onChange?.(firstReady.id);
  }, [value, versions.data, modelId, disabled, onChange]);
  useEffect(() => {
    if (!selected || !model.data || appliedId.current === selected.id) return;
    appliedId.current = selected.id;
    setChosenVersion(selected);
    onChange?.(selected.id, selected, model.data.name);
  }, [selected, model.data, onChange]);
  return (
    <Select
      aria-label="模型版本"
      value={value || undefined}
      disabled={disabled || !modelId}
      loading={versions.isFetching || selectedVersion.isFetching}
      placeholder="请选择已就绪的模型版本"
      options={items.map((item) => ({
        value: item.id,
        label: `${item.version} · ${item.status}`,
        disabled: item.status.toLowerCase() !== "ready",
      }))}
      onChange={(id) => {
        appliedId.current = "";
        onChange?.(id);
      }}
    />
  );
}
