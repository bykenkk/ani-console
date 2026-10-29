import {
  EngineSelect,
  ModelSourceInput,
  type ModelSourceInputValue,
  type EngineType,
} from "@/components/ai-models";
import {
  importModelBundle,
  type ExternalModelCandidate,
  type ExternalModelProvider,
  type ModelCapability,
  type ModelFormat,
} from "@/api/models";
import { Form, Input, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { validateForm } from "@/lib/form";
import type { ImageRegistration } from "@/api/images";
import InstanceImageSelect from "@/components/instances/InstanceImageSelect";

interface ImportModelFormValues {
  source: ModelSourceInputValue;
  name: string;
  description: string;
  revision: string;
  format: ModelFormat;
  capabilities: ModelCapability[];
  engine_type: EngineType;
  image: ImageRegistration;
  startup_command: string;
}

interface ImportModelModalProps {
  onCancel: () => void;
}

export default function ImportModelModal({ onCancel }: ImportModelModalProps) {
  const qc = useQueryClient();
  const [form] = Form.useForm<ImportModelFormValues>();
  const submitting = useRef(false);
  const selectedModel = useRef<ExternalModelCandidate>();
  const provider = useRef<ExternalModelProvider>("modelscope");
  const changeModelSource = (value: ModelSourceInputValue, candidate?: ExternalModelCandidate) => {
    const providerChanged = provider.current !== value.provider;
    const selectionCleared =
      selectedModel.current && selectedModel.current.repo_id !== value.repo_id;
    provider.current = value.provider;
    if (candidate) {
      selectedModel.current = candidate;
      form.setFieldsValue({
        name:
          candidate.name
            .toLowerCase()
            .replace(/[^a-z0-9.-]+/g, "-")
            .replace(/^[.-]+|[.-]+$/g, "")
            .slice(0, 63) || "model",
        description: candidate.description || "",
        revision: candidate.revision,
      });
    } else if (providerChanged || selectionCleared) {
      selectedModel.current = undefined;
      form.setFieldsValue({
        ...(providerChanged ? { name: "" } : {}),
        description: "",
        revision: value.provider === "modelscope" ? "master" : "main",
      });
    }
  };
  const submit = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "提交模型导入任务",
        successText: "模型导入已提交",
        errorFallback: "提交模型导入任务失败",
      },
    },
    mutationFn: (values: ImportModelFormValues) =>
      importModelBundle({
        model: {
          name: values.name.trim(),
          display_name: values.name.trim(),
          description: values.description?.trim() || undefined,
          capabilities: values.capabilities,
          external_model_id: values.source.repo_id.trim(),
        },
        version: {
          version: values.revision,
          format: values.format,
          engine_type: values.engine_type,
          recommended_image_id: values.image.image_id,
          recommended_image_scope: values.image.scope,
          startup_command: values.startup_command,
        },
        source: {
          provider: values.source.provider,
          repo_id: values.source.repo_id.trim(),
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
      const values = await validateForm<ImportModelFormValues>(form);
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
          source: { provider: "modelscope", repo_id: "" },
          revision: "master",
          format: "safetensors",
          capabilities: ["text-generation"],
          engine_type: "vllm",
        }}
      >
        <Form.Item
          field="name"
          label="名称"
          rules={[
            { required: true, message: "请输入模型名称" },
            {
              match: /^[a-z0-9.-]{1,63}$/,
              message: "模型名称只能包含小写字母、数字、点和短横线，最多 63 个字符",
            },
          ]}
        >
          <Input maxLength={63} placeholder="请输入名称" />
        </Form.Item>
        <Form.Item
          field="source"
          label="模型"
          required
          validateTrigger="onRepoChange"
          extra="支持手动输入，搜索结果仅供参考"
          rules={[
            {
              validator: (value: ModelSourceInputValue | undefined, callback) => {
                if (!value?.provider) callback("请选择来源");
                else if (!value.repo_id?.trim()) callback("请输入外部模型仓库 ID");
              },
            },
          ]}
        >
          <ModelSourceInput
            onChange={changeModelSource}
            onProviderChange={() => form.setFields({ source: { error: undefined } })}
          />
        </Form.Item>
        <Form.Item field="revision" label="版本 / Revision" rules={[{ required: true }]}>
          <Input maxLength={128} placeholder="请输入版本 / Revision" />
        </Form.Item>
        <Form.Item
          field="format"
          label="模型格式"
          rules={[{ required: true, message: "请选择模型格式" }]}
        >
          <Select
            placeholder="请选择模型格式"
            options={[
              { value: "safetensors", label: "Safetensors" },
              { value: "gguf", label: "GGUF" },
              { value: "pytorch", label: "PyTorch" },
            ]}
          />
        </Form.Item>
        <Form.Item
          field="capabilities"
          label="模型能力"
          rules={[{ required: true, message: "请选择至少一个模型能力" }]}
        >
          <Select
            mode="multiple"
            placeholder="请选择模型能力"
            options={[
              { value: "text-generation", label: "文本生成" },
              { value: "embedding", label: "文本向量化" },
              { value: "speech-to-text", label: "语音识别" },
            ]}
          />
        </Form.Item>
        <Form.Item
          field="engine_type"
          label="镜像类型"
          rules={[{ required: true, message: "请选择引擎类型" }]}
        >
          <EngineSelect />
        </Form.Item>
        <Form.Item
          field="image"
          label="引擎镜像"
          validateTrigger="onSelect"
          rules={[{ type: "object", required: true, message: "请选择已注册的镜像" }]}
        >
          {/* TODO(model-image-pagination): 暂用容器现有目录查询，后端支持 page/pageSize 后统一迁移。 */}
          <InstanceImageSelect
            onScopeChange={() => form.setFields({ image: { error: undefined } })}
          />
        </Form.Item>
        <Form.Item
          field="startup_command"
          label="完整启动命令"
          rules={[{ required: true, message: "请输入完整启动命令" }]}
          extra="完整命令由调用方提供，平台不会拼接参数"
        >
          <Input.TextArea placeholder="请输入完整启动命令" autoSize={{ minRows: 2, maxRows: 5 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
