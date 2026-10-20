import {
  EngineSelect,
  ModelSourceInput,
  type EngineType,
  type ModelSourceValue,
} from "@/components/ai-models";
import {
  importModelBundle,
  type ExternalModelCandidate,
  type ModelCapability,
  type ModelFormat,
} from "@/api/models";
import { Form, Input, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { validateForm } from "@/lib/form";

type ImportFormValues = {
  model_source: ModelSourceValue;
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

export default function ImportModelModal({ onCancel }: { onCancel: () => void }) {
  const qc = useQueryClient();
  const [form] = Form.useForm<ImportFormValues>();
  const submitting = useRef(false);
  const selectedModel = useRef<ExternalModelCandidate>();
  const source = useRef<ModelSourceValue["source"]>("modelscope");
  const changeModelSource = (value: ModelSourceValue, candidate?: ExternalModelCandidate) => {
    const sourceChanged = source.current !== value.source;
    const selectionCleared =
      selectedModel.current && selectedModel.current.repo_id !== value.repo_id;
    source.current = value.source;
    if (candidate) {
      selectedModel.current = candidate;
      form.setFieldsValue({
        model_name:
          candidate.name
            .toLowerCase()
            .replace(/[^a-z0-9.-]+/g, "-")
            .replace(/^[.-]+|[.-]+$/g, "")
            .slice(0, 63) || "model",
        display_name: candidate.display_name || candidate.name,
        description: candidate.description || "",
        revision: candidate.revision,
      });
    } else if (sourceChanged || selectionCleared) {
      selectedModel.current = undefined;
      form.setFieldsValue({
        ...(sourceChanged ? { model_name: "" } : {}),
        display_name: "",
        description: "",
        revision: value.source === "modelscope" ? "master" : "main",
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
    mutationFn: (values: ImportFormValues) =>
      importModelBundle({
        model: {
          name: values.model_name.trim(),
          display_name: values.display_name?.trim() || undefined,
          description: values.description?.trim() || undefined,
          capabilities: values.capabilities,
          external_model_id: values.model_source.repo_id.trim(),
        },
        version: {
          version: values.revision,
          format: values.format,
          engine_type: values.engine_type,
          engine_image: values.engine_image,
          startup_command: values.startup_command,
        },
        source: {
          provider: values.model_source.source,
          repo_id: values.model_source.repo_id.trim(),
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
          model_source: { source: "modelscope", repo_id: "" },
          revision: "master",
          format: "safetensors",
          capabilities: ["text-generation"],
          engine_type: "vllm",
        }}
      >
        <Form.Item
          field="model_name"
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
          field="model_source"
          label="模型"
          required
          extra="支持手动输入，搜索结果仅供参考"
          rules={[
            {
              validator: (value: ModelSourceValue | undefined, callback) => {
                if (!value?.source) callback("请选择来源");
                else if (!value.repo_id?.trim()) callback("请输入外部模型仓库 ID");
              },
            },
          ]}
        >
          <ModelSourceInput onChange={changeModelSource} />
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
        <Form.Item label="引擎镜像" required>
          <Input.Group compact>
            <Form.Item
              field="engine_type"
              noStyle={{ showErrorTip: true }}
              rules={[{ required: true, message: "请选择引擎类型" }]}
            >
              <EngineSelect style={{ width: 140 }} />
            </Form.Item>
            <Form.Item
              field="engine_image"
              noStyle={{ showErrorTip: true }}
              rules={[{ required: true, message: "请输入引擎镜像" }]}
            >
              <Input
                aria-label="引擎镜像"
                style={{ width: "calc(100% - 140px)" }}
                placeholder="请输入引擎镜像地址"
              />
            </Form.Item>
          </Input.Group>
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
