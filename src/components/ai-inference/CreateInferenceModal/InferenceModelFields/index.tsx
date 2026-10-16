import { Button, Form, Select, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getModel,
  getModelVersion,
  listModels,
  listModelVersions,
  type ModelVersion,
} from "@/api/models";
import { withId } from "@/lib/id";

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
  const [cursor, setCursor] = useState<string>();
  const [previous, setPrevious] = useState<(string | undefined)[]>([]);
  const models = useQuery({
    queryKey: ["governance-models", "inference-options", cursor],
    queryFn: ({ signal }) => listModels({ status: "ready", cursor }, signal),
    meta: { errorNotification: { id: "inference-models", action: "模型列表加载" } },
  });
  return (
    <>
      <Form.Item
        label="模型"
        required
        extra={
          (previous.length > 0 || models.data?.meta?.next_cursor) && (
            <Space>
              <Button
                size="mini"
                disabled={models.isFetching || !previous.length}
                onClick={() => {
                  setCursor(previous[previous.length - 1]);
                  setPrevious((current) => current.slice(0, -1));
                }}
              >
                上一页模型
              </Button>
              <Button
                size="mini"
                disabled={models.isFetching || !models.data?.meta?.next_cursor}
                onClick={() => {
                  setPrevious((current) => [...current, cursor]);
                  setCursor(models.data!.meta!.next_cursor);
                }}
              >
                下一页模型
              </Button>
            </Space>
          )
        }
      >
        <Select
          value={modelId || undefined}
          loading={models.isFetching}
          showSearch
          placeholder="请选择已就绪的模型"
          options={[
            ...(modelId && !models.data?.models?.some((item) => item.id === modelId)
              ? [{ value: modelId, label: modelId }]
              : []),
            ...(models.data?.models ?? []).map((item) => ({
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
  const [cursor, setCursor] = useState<string>();
  const [previous, setPrevious] = useState<(string | undefined)[]>([]);
  const [chosenVersion, setChosenVersion] = useState<ModelVersion>();
  const model = useQuery({
    queryKey: ["governance-model", modelId],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => getModel(modelId, signal),
    meta: { errorNotification: { id: withId("inference-model", modelId), action: "模型详情加载" } },
  });
  const versions = useQuery({
    queryKey: ["governance-model-versions", modelId, cursor],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => listModelVersions(modelId, { cursor }, signal),
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
  const items = [...(versions.data?.versions ?? [])];
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
    const firstReady = versions.data.versions?.find(
      (item) => item.status.toLowerCase() === "ready",
    );
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
      rules={[{ required: true, message: "请选择已就绪的模型版本" }]}
      extra={
        (previous.length > 0 || versions.data?.meta?.next_cursor) && (
          <Space>
            <Button
              size="mini"
              disabled={versions.isFetching || !previous.length}
              onClick={() => {
                setCursor(previous[previous.length - 1]);
                setPrevious((current) => current.slice(0, -1));
              }}
            >
              上一页版本
            </Button>
            <Button
              size="mini"
              disabled={versions.isFetching || !versions.data?.meta?.next_cursor}
              onClick={() => {
                setPrevious((current) => [...current, cursor]);
                setCursor(versions.data!.meta!.next_cursor);
              }}
            >
              下一页版本
            </Button>
          </Space>
        )
      }
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
