import {
  importModelBundle,
  searchExternalModels,
  type ExternalModelCandidate,
  type ImportModelInput,
  type ModelCapability,
  type ModelFormat,
} from "@/api/models";
import { Form, Input, Modal, Select, Space } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { validateForm } from "@/lib/form";

type EngineType = "vllm" | "sglang";

type ImportFormValues = {
  source: ImportModelInput["source"];
  repo_id: string;
  model_name: string;
  display_name: string;
  description: string;
  revision: string;
  format: ModelFormat;
  capabilities: ModelCapability[];
  engine_type: EngineType;
  engine_image: string;
  startup_command: string;
};

function modelNameFromCandidate(candidate: ExternalModelCandidate): string {
  const normalized = candidate.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 63);
  return normalized || "model";
}

export default function ImportModelModal({ onCancel }: { onCancel: () => void }) {
  const qc = useQueryClient();
  const [form] = Form.useForm<ImportFormValues>();
  const submitting = useRef(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [source, setSource] = useState<ImportFormValues["source"]>("huggingface");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchKeyword(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const search = useQuery({
    queryKey: ["external-models", source, searchKeyword],
    enabled: searchKeyword.length >= 2,
    queryFn: ({ signal }) =>
      searchExternalModels({ source, keyword: searchKeyword, page: 1, pageSize: 20 }, signal),
    meta: {
      errorNotification: {
        id: "external-model-search",
        action: "外部模型搜索",
        fallback: "模型搜索失败，请稍后重试",
      },
    },
  });

  const submit = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "提交模型导入任务",
        successText: "模型导入已提交",
        errorFallback: "提交模型导入任务失败",
      },
    },
    mutationFn: (values: ImportFormValues) =>
      importModelBundle({
        model: {
          name: values.model_name.trim(),
          display_name: values.display_name?.trim() || undefined,
          description: values.description?.trim() || undefined,
          capabilities: values.capabilities,
          external_model_id: values.repo_id,
        },
        version: {
          version: values.revision,
          format: values.format,
          engine_type: values.engine_type,
          engine_image: values.engine_image,
          startup_command: values.startup_command,
        },
        source: {
          provider: values.source,
          repo_id: values.repo_id,
          revision: values.revision,
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["governance-models"] });
      onCancel();
    },
  });

  const onSubmit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<ImportFormValues>(form);
      await submit.mutateAsync(values);
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal
      visible
      title="导入模型"
      okText="开始导入"
      confirmLoading={submit.isPending}
      onCancel={onCancel}
      onOk={onSubmit}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          source: "huggingface",
          revision: "main",
          format: "safetensors",
          capabilities: ["text-generation"],
          engine_type: "vllm",
        }}
      >
        <Form.Item field="source" label="来源" rules={[{ required: true, message: "请选择来源" }]}>
          <Select
            options={[
              { value: "huggingface", label: "HuggingFace" },
              { value: "modelscope", label: "ModelScope" },
            ]}
            onChange={(value) => {
              setSource(value);
              form.setFieldsValue({ revision: value === "modelscope" ? "master" : "main" });
              setSearchInput("");
              setSearchKeyword("");
            }}
          />
        </Form.Item>
        <Form.Item
          field="model_name"
          label="模型名称"
          rules={[
            { required: true, message: "请输入模型名称" },
            {
              validator: (value, callback) => {
                if (typeof value !== "string" || !/^[a-z0-9.-]{1,63}$/.test(value.trim())) {
                  callback("模型名称只能包含小写字母、数字、点和短横线，最多 63 个字符");
                } else {
                  callback();
                }
              },
            },
          ]}
          extra="输入名称后自动搜索，选择候选模型；只能使用小写字母、数字、点和短横线，最多 63 个字符"
        >
          <Select
            showSearch
            allowCreate
            filterOption={false}
            placeholder="输入模型名称搜索并选择"
            loading={search.isFetching}
            onSearch={setSearchInput}
            options={(search.data?.items ?? []).map((candidate) => ({
              value: modelNameFromCandidate(candidate),
              label: `${candidate.display_name || candidate.name} · ${candidate.repo_id}`,
            }))}
            onChange={(value) => {
              const modelName = String(value);
              const candidate = (search.data?.items ?? []).find(
                (item) => modelNameFromCandidate(item) === modelName,
              );
              if (!candidate) {
                form.setFieldsValue({ repo_id: "" });
                return;
              }
              form.setFieldsValue({
                repo_id: candidate.repo_id,
                model_name: modelName,
                display_name: candidate.display_name || candidate.name,
                description: candidate.description || "",
                revision: candidate.revision,
              });
            }}
          />
        </Form.Item>
        <Form.Item field="repo_id" rules={[{ required: true, message: "请选择搜索结果中的模型" }]}>
          <Input style={{ display: "none" }} />
        </Form.Item>
        <Space className="w-full" align="start">
          <Form.Item field="revision" label="版本 / Revision" rules={[{ required: true }]}>
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item
            field="format"
            label="模型格式"
            rules={[{ required: true, message: "请选择模型格式" }]}
          >
            <Select
              options={[
                { value: "safetensors", label: "Safetensors" },
                { value: "gguf", label: "GGUF" },
                { value: "pytorch", label: "PyTorch" },
              ]}
            />
          </Form.Item>
        </Space>
        <Form.Item
          field="capabilities"
          label="模型能力"
          rules={[{ required: true, message: "请选择至少一个模型能力" }]}
        >
          <Select
            mode="multiple"
            options={[
              { value: "text-generation", label: "文本生成" },
              { value: "embedding", label: "文本向量化" },
              { value: "speech-to-text", label: "语音识别" },
            ]}
          />
        </Form.Item>
        <Form.Item
          field="engine_type"
          label="引擎类型"
          rules={[{ required: true, message: "请选择引擎类型" }]}
        >
          <Select
            options={[
              { value: "vllm", label: "vLLM" },
              { value: "sglang", label: "SGLang" },
            ]}
          />
        </Form.Item>
        <Form.Item
          field="engine_image"
          label="引擎镜像"
          rules={[{ required: true, message: "请输入引擎镜像" }]}
        >
          <Input placeholder="例如 registry.example.com/vllm:tag" />
        </Form.Item>
        <Form.Item
          field="startup_command"
          label="完整启动命令"
          rules={[{ required: true, message: "请输入完整启动命令" }]}
          extra="完整命令由调用方提供，平台不会拼接参数"
        >
          <Input.TextArea
            placeholder="例如 vllm serve /models --served-model-name qwen"
            autoSize={{ minRows: 2, maxRows: 5 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
