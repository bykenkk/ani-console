// TODO(submit-result): 向量存储尚未完成 governance 对齐；后续对接时确认创建响应用途，清理当前无人使用的 onCreated 回传。
import { withFirst100 } from "@/api/pagination";
import { listInferenceServices } from "@/api/inference";
import {
  createVectorStore,
  type VectorMetric,
  type VectorStore,
} from "@/api/storage/vector-stores";
import { withId } from "@/lib/id";
import { Form, Input, InputNumber, Modal, Select, Typography } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type CreateVectorStoreModalProps = {
  onCancel: () => void;
  onCreated?: (store: VectorStore) => void;
};

const listInferenceOptions = withFirst100(listInferenceServices);

export default function CreateVectorStoreModal({
  onCancel,
  onCreated,
}: CreateVectorStoreModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [dimension, setDimension] = useState(1536);
  const [metric, setMetric] = useState<VectorMetric>("cosine");
  // FIXME(inference-contract): 当前推理调用对应的目标路由仍待确认。
  // TODO(inference-contract): 路由恢复后验证 capability/status 筛选及可调用模型选项。
  const models = useQuery({
    meta: {
      errorNotification: {
        id: withId("inference-models", "embedding"),
        action: "向量化模型列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["governance-inference-services", "options", "embedding", "running"],
    queryFn: ({ signal }) =>
      listInferenceOptions({ capability: "embedding", status: "running" }, signal),
  });
  const modelOptions = useMemo(
    () => (models.data?.items ?? []).map((item) => item.served_model_name),
    [models.data?.items],
  );
  useEffect(() => {
    if (embeddingModel || !modelOptions[0]) return;
    setEmbeddingModel(modelOptions[0]);
  }, [embeddingModel, modelOptions]);

  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建向量存储",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (_: undefined) => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("请输入向量存储名称");
      if (!embeddingModel) throw new Error("请选择 向量化模型");
      if (!Number.isInteger(dimension) || dimension < 1)
        throw new Error("向量维度必须是大于 0 的整数");
      const submitData = {
        name: trimmedName,
        embedding_model: embeddingModel,
        dimension,
        metric,
      };
      return createVectorStore(submitData);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["vector-stores"] });
      onCreated?.(data);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建向量存储"
      onCancel={onCancel}
      onOk={() => create.mutateAsync(undefined)}
      confirmLoading={create.isPending}
      unmountOnExit
    >
      <Form layout="vertical">
        <Form.Item label="名称" required>
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入向量存储名称"
            maxLength={64}
            showWordLimit
          />
        </Form.Item>
        <Form.Item label="向量化模型" required>
          <Select
            value={embeddingModel}
            onChange={setEmbeddingModel}
            loading={models.isLoading}
            showSearch
            placeholder="请选择 向量化模型"
          >
            {modelOptions.map((model) => (
              <Select.Option key={model} value={model}>
                {model}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="向量维度" required>
          <InputNumber
            value={dimension}
            min={1}
            precision={0}
            className="w-full"
            onChange={(value) => setDimension(Number(value ?? 1))}
          />
        </Form.Item>
        <Form.Item label="距离度量" required>
          <Select value={metric} onChange={setMetric}>
            <Select.Option value="cosine">Cosine · 余弦相似度</Select.Option>
            <Select.Option value="l2">L2 · 欧氏距离</Select.Option>
            <Select.Option value="ip">IP · 内积</Select.Option>
          </Select>
        </Form.Item>
        <Typography.Text type="secondary">
          维度和距离度量创建后不可修改，请与写入数据的嵌入模型保持一致。
        </Typography.Text>
      </Form>
    </Modal>
  );
}
