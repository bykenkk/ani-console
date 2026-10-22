import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getModel, getModelVersion, listModelVersions, type ModelVersion } from "@/api/models";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";
import type { ModelPageParams } from "@/api/models";
import { StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

const VERSION_STATUS_LABELS: Record<string, string> = {
  ready: "就绪",
  downloading: "下载中",
  error: "失败",
};

const listVersionOptions = withFirst100(
  (params: ModelPageParams & { modelId: string }, signal?: AbortSignal) => {
    const { modelId, ...page } = params;
    return listModelVersions(modelId, page, signal);
  },
);

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
  const [chosenVersion, setChosenVersion] = useState<{ modelId: string; version: ModelVersion }>();
  const model = useQuery({
    queryKey: ["governance-model", modelId],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => getModel(modelId, signal),
    meta: { errorNotification: { id: withId("inference-model", modelId), action: "模型详情加载" } },
  });
  // TODO(model-contract): 联调版本归属、就绪状态及初始选择回显。
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
  if (
    chosenVersion?.modelId === modelId &&
    !items.some((item) => item.id === chosenVersion.version.id)
  )
    items.push(chosenVersion.version);
  const loadedVersion = selectedVersion.data?.version;
  if (
    loadedVersion &&
    selectedVersion.data?.model.id === modelId &&
    !items.some((item) => item.id === loadedVersion.id)
  )
    items.push(loadedVersion);
  const selected = items.find((item) => item.id === value);
  useEffect(() => {
    if (value || !versions.data || !modelId || disabled) return;
    const firstReady = versions.data.items.find((item) => item.status.toLowerCase() === "ready");
    if (firstReady) onChange?.(firstReady.id);
  }, [value, versions.data, modelId, disabled, onChange]);
  useEffect(() => {
    if (!selected || model.data?.id !== modelId || appliedId.current === selected.id) return;
    appliedId.current = selected.id;
    setChosenVersion({ modelId: model.data.id, version: selected });
    onChange?.(selected.id, selected, model.data.name);
  }, [selected, model.data, modelId, onChange]);
  return (
    <Select
      aria-label="模型版本"
      value={value || undefined}
      disabled={disabled || !modelId}
      loading={versions.isFetching || selectedVersion.isFetching}
      placeholder="请选择已就绪的模型版本"
      options={items.map((item) => ({
        value: item.id,
        label: (
          <span className="inline-flex max-w-full items-center gap-2 align-middle">
            <span className="truncate">
              {item.version} · {formatDateTime(item.created_at)}
            </span>
            <StatusBadge
              className="shrink-0"
              status={item.status}
              tone={item.status.toLowerCase() === "downloading" ? "primary" : undefined}
              showIndicator={false}
            >
              {VERSION_STATUS_LABELS[item.status.toLowerCase()] ?? item.status}
            </StatusBadge>
          </span>
        ),
        disabled: item.status.toLowerCase() !== "ready",
      }))}
      onChange={(id) => {
        appliedId.current = "";
        onChange?.(id);
      }}
    />
  );
}
