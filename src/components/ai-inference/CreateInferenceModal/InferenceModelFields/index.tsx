import { withFirst100 } from "@/api/pagination";
import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getModel,
  getModelVersion,
  listModels,
  listModelVersions,
  type ModelVersion,
  type ModelPageParams,
} from "@/api/models";
import { withId } from "@/lib/id";

const listModelOptions = withFirst100(listModels);
const listVersionOptions = withFirst100(
  ({ modelId, ...params }: { modelId: string } & ModelPageParams, signal?: AbortSignal) =>
    listModelVersions(modelId, params, signal),
);

export default function InferenceModelFields({
  initialModelId,
  initialModelVersionId,
  onVersionChange,
}: {
  initialModelId?: string;
  initialModelVersionId?: string;
  onVersionChange: (version?: ModelVersion, modelName?: string) => void;
}) {
  const [modelId, setModelId] = useState(initialModelId ?? "");
  // FIXME(model-contract): 用户确认保留原分支模型列表，尚未与当前后端索引对齐。
  // TODO(model-contract): 目标版本确认后验证模型选项及初始选择回显。
  const models = useQuery({
    queryKey: ["governance-models", "options"],
    queryFn: ({ signal }) => listModelOptions({}, signal),
    meta: { errorNotification: { id: "inference-models", action: "模型列表加载" } },
  });
  return (
    <>
      <Form.Item label="模型">
        <Select
          value={modelId || undefined}
          loading={models.isFetching}
          showSearch
          placeholder="请选择已就绪的模型"
          options={[
            ...(modelId && !models.data?.items?.some((item) => item.id === modelId)
              ? [{ value: modelId, label: modelId }]
              : []),
            ...(models.data?.items ?? []).map((item) => ({
              value: item.id,
              label: item.display_name || item.name,
            })),
          ]}
          onChange={(id) => {
            setModelId(id);
            onVersionChange();
          }}
        />
      </Form.Item>
      <InferenceVersionFields
        key={modelId}
        modelId={modelId}
        initialVersionId={modelId === initialModelId ? initialModelVersionId : undefined}
        onVersionChange={onVersionChange}
      />
    </>
  );
}

function InferenceVersionFields({
  modelId,
  initialVersionId,
  onVersionChange,
}: {
  modelId: string;
  initialVersionId?: string;
  onVersionChange: (version?: ModelVersion, modelName?: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(initialVersionId ?? "");
  const [appliedId, setAppliedId] = useState("");
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
  const initial = useQuery({
    queryKey: ["governance-model-version", initialVersionId],
    enabled: Boolean(initialVersionId),
    queryFn: ({ signal }) => getModelVersion(initialVersionId!, signal),
    meta: {
      errorNotification: {
        id: withId("inference-version", initialVersionId),
        action: "模型版本加载",
      },
    },
  });
  const items = [...(versions.data?.items ?? [])];
  if (chosenVersion && !items.some((item) => item.id === chosenVersion.id))
    items.push(chosenVersion);
  const initialVersion = initial.data?.version;
  if (
    initialVersion?.model_id === modelId &&
    !items.some((item) => item.id === initialVersion.id)
  ) {
    items.push(initialVersion);
  }
  const selected = items.find((item) => item.id === selectedId);
  useEffect(() => {
    if (selectedId || !versions.data) return;
    const firstReady = versions.data.items?.find((item) => item.status.toLowerCase() === "ready");
    if (firstReady) setSelectedId(firstReady.id);
  }, [selectedId, versions.data]);
  useEffect(() => {
    if (!selected || !model.data || appliedId === selected.id) return;
    onVersionChange(selected, model.data.name);
    setChosenVersion(selected);
    setAppliedId(selected.id);
  }, [selected, model.data, appliedId, onVersionChange]);
  return (
    <Form.Item
      field="model_version_id"
      label="模型版本"
      rules={[{ type: "string", required: true, message: "请选择已就绪的模型版本" }]}
    >
      <Select
        value={selectedId || undefined}
        disabled={!modelId}
        loading={versions.isFetching || initial.isFetching}
        placeholder="请选择已就绪的模型版本"
        options={items.map((item) => ({
          value: item.id,
          label: `${item.version} · ${item.status}`,
          disabled: item.status.toLowerCase() !== "ready",
        }))}
        onChange={(id) => {
          setSelectedId(id);
          setAppliedId("");
        }}
      />
    </Form.Item>
  );
}
