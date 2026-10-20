import { importModelBundle, type ModelCapability, type ModelFormat } from "@/api/models";
import { Form, Input, Modal, Select, Space } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { validateForm } from "@/lib/form";
import ImportModelSourceFields, { type ImportModelSourceValues } from "./ImportModelSourceFields";

type EngineType = "vllm" | "sglang";

type ImportFormValues = ImportModelSourceValues & {
  format: ModelFormat;
  capabilities: ModelCapability[];
  engine_type: EngineType;
  engine_image: string;
  startup_command: string;
};

export default function ImportModelModal({ onCancel }: { onCancel: () => void }) {
  const qc = useQueryClient();
  const [form] = Form.useForm<ImportFormValues>();
  const submitting = useRef(false);
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
      closable={!submit.isPending}
      escToExit={!submit.isPending}
      cancelButtonProps={{ disabled: submit.isPending }}
      onCancel={onCancel}
      onOk={onSubmit}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        disabled={submit.isPending}
        initialValues={{
          source: "huggingface",
          revision: "main",
          format: "safetensors",
          capabilities: ["text-generation"],
          engine_type: "vllm",
        }}
      >
        <ImportModelSourceFields form={form} />
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
