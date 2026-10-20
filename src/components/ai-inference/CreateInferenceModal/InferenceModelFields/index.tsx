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
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const models = useQuery({
    queryKey: ["governance-models", "inference-options", page, pageSize],
    queryFn: ({ signal }) => listModels({ page, pageSize }, signal),
    meta: { errorNotification: { id: "inference-models", action: "模型列表加载" } },
  });
  return (
    <>
      <Form.Item
        label="模型"
        extra={
          (page > 1 || page * pageSize < Number(models.data?.total ?? 0)) && (
            <Space>
              <Button
                size="mini"
                disabled={models.isFetching || page === 1}
                onClick={() => {
                  setPage((current) => Math.max(1, current - 1));
                }}
              >
                上一页模型
              </Button>
              <Button
                size="mini"
                disabled={models.isFetching || page * pageSize >= Number(models.data?.total ?? 0)}
                onClick={() => {
                  setPage((current) => current + 1);
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
            setPage(1);
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
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [chosenVersion, setChosenVersion] = useState<ModelVersion>();
  const model = useQuery({
    queryKey: ["governance-model", modelId],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => getModel(modelId, signal),
    meta: { errorNotification: { id: withId("inference-model", modelId), action: "模型详情加载" } },
  });
  const versions = useQuery({
    queryKey: ["governance-model-versions", modelId, page, pageSize],
    enabled: Boolean(modelId),
    queryFn: ({ signal }) => listModelVersions(modelId, { page, pageSize }, signal),
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
      extra={
        (page > 1 || page * pageSize < Number(versions.data?.total ?? 0)) && (
          <Space>
            <Button
              size="mini"
              disabled={versions.isFetching || page === 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
              }}
            >
              上一页版本
            </Button>
            <Button
              size="mini"
              disabled={versions.isFetching || page * pageSize >= Number(versions.data?.total ?? 0)}
              onClick={() => {
                setPage((current) => current + 1);
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
