import { Form, Input, InputNumber, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  createInferenceService,
  type CreateInferenceInput,
  type InferenceAcceptance,
  type InferenceGpuSelection,
} from "@/api/inference";
import { getModelVersion, type ModelVersion } from "@/api/models";
import { showMessage } from "@/lib/feedback";
import InferenceModelFields from "./InferenceModelFields";
import InferenceGpuFields from "./InferenceGpuFields";

type CreateValues = CreateInferenceInput & {
  gpu_cluster_id?: string;
  gpu_pool_id?: string;
  gpu_profile?: string;
};

export default function CreateInferenceModal({
  onCancel,
  onCreated,
  initialServiceName,
  initialModelId,
  initialModelVersionId,
}: {
  onCancel: () => void;
  onCreated?: (result: InferenceAcceptance) => void;
  initialServiceName?: string;
  initialModelId?: string;
  initialModelVersionId?: string;
}) {
  const [form] = Form.useForm<CreateValues>();
  const qc = useQueryClient();
  const submitting = useRef(false);
  const [gpu, setGpu] = useState<InferenceGpuSelection>();
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [replicas, setReplicas] = useState(1);
  const [distributed, setDistributed] = useState(false);
  const [workers, setWorkers] = useState(1);
  const [version, setVersion] = useState<ModelVersion>();
  const changeVersion = useCallback(
    (selected?: ModelVersion, modelName?: string) => {
      setVersion(selected);
      form.setFieldsValue({
        model_version_id: selected?.id,
        served_model_name: modelName ?? "",
        engine_image: selected?.engine_image ?? "",
        engine_type: selected?.engine_type ?? "",
        command: selected?.startup_command ?? "",
      });
    },
    [form],
  );
  const create = useMutation({
    mutationFn: async (input: CreateInferenceInput) => {
      const latest = await getModelVersion(input.model_version_id);
      if (latest.version.status.toLowerCase() !== "ready")
        throw new Error("模型版本尚未就绪，请重新选择");
      return createInferenceService(input);
    },
    meta: {
      feedback: {
        channel: "message",
        action: "部署推理服务",
        successText: "推理服务部署已提交",
        errorFallback: "部署失败",
      },
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["governance-inference-services"] });
      onCreated?.(result);
      onCancel();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      let values: CreateValues;
      try {
        values = await form.validate();
      } catch (error) {
        const fieldErrors = form.getFieldsError();
        const firstError = Object.values(fieldErrors)
          .flat()
          .find((item) => typeof item?.message === "string");
        showMessage({
          type: "error",
          content:
            typeof firstError?.message === "string"
              ? firstError.message
              : "请检查并修正表单中的错误项",
        });
        throw error;
      }
      if (
        !version ||
        values.model_version_id !== version.id ||
        version.status.toLowerCase() !== "ready"
      ) {
        showMessage({ type: "error", content: "请选择已就绪的模型版本" });
        return;
      }
      if (gpuEnabled && !gpu) {
        showMessage({ type: "error", content: "请完整选择 GPU 集群、资源池和已发布规格" });
        return;
      }
      await create.mutateAsync({
        name: values.name.trim(),
        model_version_id: version.id,
        served_model_name: values.served_model_name.trim(),
        engine_image: values.engine_image.trim(),
        engine_type: values.engine_type.trim(),
        command: values.command,
        cpu: values.cpu.trim(),
        memory: values.memory.trim(),
        replicas: values.replicas,
        runtime_mode: values.runtime_mode,
        ...(distributed ? { worker_replicas: values.worker_replicas } : {}),
        ...(gpu ? { gpu } : {}),
      });
    } catch {
      // 字段校验由统一入口提示；请求错误由 mutation feedback 处理。
    } finally {
      submitting.current = false;
    }
  };
  const required = (message: string) => [{ type: "string", required: true, match: /\S/, message }];
  return (
    <Modal
      visible
      title="部署推理服务"
      okText="开始部署"
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={create.isPending}
      cancelButtonProps={{ disabled: create.isPending }}
      closable={!create.isPending}
      escToExit={!create.isPending}
      style={{ width: 720, maxWidth: "calc(100vw - 48px)" }}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={create.isPending}
        initialValues={{
          name: initialServiceName ?? "",
          replicas: 1,
          cpu: "8",
          memory: "32Gi",
          runtime_mode: "RUNTIME_MODE_DEPLOYMENT",
          worker_replicas: 1,
        }}
      >
        <Form.Item field="name" label="服务名称" rules={required("请输入服务名称")}>
          <Input maxLength={63} placeholder="例如 qwen-service" />
        </Form.Item>
        <InferenceModelFields
          initialModelId={initialModelId}
          initialModelVersionId={initialModelVersionId}
          onVersionChange={changeVersion}
        />
        <Form.Item
          field="served_model_name"
          label="服务模型名"
          rules={required("请输入服务模型名")}
        >
          <Input placeholder="客户端请求中使用的模型名" />
        </Form.Item>
        <Form.Item field="engine_image" label="运行镜像" rules={required("请输入运行镜像地址")}>
          <Input placeholder="registry.example/vllm:latest" />
        </Form.Item>
        <Form.Item field="engine_type" label="引擎类型" rules={required("请输入引擎类型")}>
          <Input placeholder="例如 vllm" />
        </Form.Item>
        <Form.Item
          field="command"
          label="启动命令"
          rules={required("请输入完整启动命令")}
          extra="提交完整命令，建议以 exec 开头；镜像需包含 /bin/sh。模型版本仅提供默认值。"
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="exec vllm serve /models --served-model-name ..."
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item field="cpu" label="CPU" rules={required("请输入正数 CPU 资源量")}>
            <Input placeholder="例如 8 或 500m" />
          </Form.Item>
          <Form.Item field="memory" label="内存" rules={required("请输入正数内存资源量")}>
            <Input placeholder="例如 32Gi" />
          </Form.Item>
        </div>
        <Form.Item
          field="runtime_mode"
          label="运行模式"
          rules={[{ type: "string", required: true }]}
        >
          <Select
            options={[
              { value: "RUNTIME_MODE_DEPLOYMENT", label: "Deployment" },
              { value: "RUNTIME_MODE_LEADER_WORKER_SET", label: "LeaderWorkerSet（分布式）" },
            ]}
            onChange={(value) => setDistributed(value === "RUNTIME_MODE_LEADER_WORKER_SET")}
          />
        </Form.Item>
        <Form.Item
          field="replicas"
          label={distributed ? "副本组数" : "副本数"}
          rules={[{ required: true, type: "number", min: 1, message: "请输入大于 0 的整数" }]}
        >
          <InputNumber
            min={1}
            max={2147483647}
            precision={0}
            onChange={(value) => setReplicas(value ?? 1)}
          />
        </Form.Item>
        {distributed && (
          <Form.Item
            field="worker_replicas"
            label="每组 Worker 数"
            rules={[{ required: true, type: "number", min: 1, message: "请输入大于 0 的整数" }]}
          >
            <InputNumber
              min={1}
              max={2147483647}
              precision={0}
              onChange={(value) => setWorkers(value ?? 1)}
            />
          </Form.Item>
        )}
        <InferenceGpuFields
          replicas={replicas}
          distributed={distributed}
          workerReplicas={workers}
          onChange={setGpu}
          onEnabledChange={setGpuEnabled}
        />
      </Form>
    </Modal>
  );
}
