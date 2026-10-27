import { Select, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getModel, listModelVersions, type ModelVersion } from "@/api/models";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";
import type { ModelVersionListParams } from "@/api/models";
import { formatDateTime } from "@/lib/format";

const listVersionOptions = withFirst100(
  (params: ModelVersionListParams & { modelId: string }, signal?: AbortSignal) => {
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
  const model = useQuery({
    queryKey: ["governance-model", modelId],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => getModel(modelId, signal),
    meta: { errorNotification: { id: withId("inference-model", modelId), action: "模型详情加载" } },
  });
  // TODO(model-contract): 联调版本归属、就绪状态及初始选择回显。
  const versions = useQuery({
    queryKey: ["governance-model-versions", modelId, "options", { status: "ready" }],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => listVersionOptions({ modelId, status: "ready" }, signal),
    meta: {
      errorNotification: { id: withId("inference-versions", modelId), action: "模型版本加载" },
    },
  });
  const items = versions.data?.items ?? [];
  const selected = items.find((item) => item.id === value);
  const modelName = model.data?.id === modelId ? model.data.name : undefined;
  useEffect(() => {
    if (value || !versions.data || !modelId || disabled) return;
    const firstReady = versions.data.items[0];
    if (firstReady) {
      appliedId.current = modelName === undefined ? "" : firstReady.id;
      onChange?.(firstReady.id, firstReady, modelName);
    }
  }, [value, versions.data, modelId, modelName, disabled, onChange]);
  useEffect(() => {
    if (!selected || model.data?.id !== modelId || appliedId.current === selected.id) return;
    appliedId.current = selected.id;
    onChange?.(selected.id, selected, model.data.name);
  }, [selected, model.data, modelId, onChange]);
  return (
    <Select
      aria-label="模型版本"
      value={value || undefined}
      disabled={disabled || !modelId}
      loading={versions.isFetching}
      placeholder="请选择模型版本"
      options={items.map((item) => ({
        value: item.id,
        label: (
          <Space size={8} align="baseline">
            <span>{item.version}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatDateTime(item.created_at)}
            </Typography.Text>
          </Space>
        ),
      }))}
      onChange={(id) => {
        appliedId.current = modelName === undefined ? "" : id;
        onChange?.(
          id,
          items.find((item) => item.id === id),
          modelName,
        );
      }}
    />
  );
}
