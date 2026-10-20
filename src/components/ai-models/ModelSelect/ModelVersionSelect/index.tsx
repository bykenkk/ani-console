import { withFirst100 } from "@/api/pagination";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getModel, getModelVersion, listModelVersions, type ModelVersion } from "@/api/models";
import { withId } from "@/lib/id";
import type { ModelVersionSelectProps, ModelVersionOptionsParams } from "./types";

const listVersionOptions = withFirst100(
  ({ modelId, ...params }: ModelVersionOptionsParams, signal?: AbortSignal) =>
    listModelVersions(modelId, params, signal),
);

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
  // FIXME(model-contract): 用户确认保留原分支版本列表，当前索引仍是游标契约。
  // TODO(model-contract): 目标版本就绪后验证前 100 项选项、版本归属及就绪状态。
  const versions = useQuery({
    queryKey: ["governance-model-versions", modelId, "options"],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => listVersionOptions({ modelId }, signal),
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
  const items = [...(versions.data?.items ?? [])];
  if (chosenVersion?.model_id === modelId && !items.some((item) => item.id === chosenVersion.id))
    items.push(chosenVersion);
  const loadedVersion = selectedVersion.data?.version;
  if (loadedVersion?.model_id === modelId && !items.some((item) => item.id === loadedVersion.id))
    items.push(loadedVersion);
  const selected = items.find((item) => item.id === value);
  useEffect(() => {
    if (value || !versions.data || !modelId || disabled) return;
    const firstReady = versions.data.items?.find((item) => item.status.toLowerCase() === "ready");
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

export type { ModelVersionSelectProps } from "./types";
