import { Form, Grid, Input, InputNumber, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  createInferenceService,
  type CreateInferenceInput,
  type InferenceRuntimeMode,
} from "@/api/inference";
import { getModelVersion, type ModelVersion } from "@/api/models";
import { showMessage } from "@/lib/feedback";
import { validateForm } from "@/lib/form";
import { randomString } from "@/lib/random";
import { EngineSelect, ModelSelect, ModelVersionSelect } from "@/components/ai-models";

interface CreateInferenceFormValues {
  name: string;
  model_id: string;
  model_version_id: string;
  engine_type: string;
  engine_image: string;
  command: string;
  cpu: number;
  memory: number;
  runtime_mode: InferenceRuntimeMode;
  replicas: number;
  worker_replicas?: number;
}

interface CreateInferenceModalProps {
  onCancel: () => void;
  initialServiceName?: string;
  initialModelId?: string;
  initialModelVersionId?: string;
}

export default function CreateInferenceModal({
  onCancel,
  initialServiceName,
  initialModelId,
  initialModelVersionId,
}: CreateInferenceModalProps) {
  const [form] = Form.useForm<CreateInferenceFormValues>();
  const qc = useQueryClient();
  const submitting = useRef(false);
  const [modelName, setModelName] = useState("");
  const [distributed, setDistributed] = useState(false);
  const [modelId, setModelId] = useState(initialModelId ?? "");
  const [version, setVersion] = useState<ModelVersion>();
  const changeVersion = useCallback(
    (id: string, selected?: ModelVersion, modelName?: string) => {
      setVersion(selected);
      setModelName(modelName ?? "");
      form.setFieldsValue({
        model_version_id: id,
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
      // FIXME(inference-contract): 用户确认保留原分支提交契约；推理管理路由尚待后端恢复。
      // TODO(inference-model-config): 目标版本就绪后联调模型参数预填、用户修改及切换版本；提交采用用户确认的表单值，不以最新模型配置覆盖。
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
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["governance-inference-services"] });
      // TODO(inference-task): 后续统一接入部署任务跟踪；当前仅刷新列表并关闭表单。
      onCancel();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<CreateInferenceFormValues>(form);
      if (
        !version ||
        values.model_version_id !== version.id ||
        version.status.toLowerCase() !== "ready"
      ) {
        showMessage({ type: "error", content: "请选择已就绪的模型版本" });
        return;
      }

      await create.mutateAsync({
        name: values.name.trim(),
        model_version_id: version.id,
        served_model_name: `${modelName}-${randomString(7)}`,
        engine_image: values.engine_image.trim(),
        engine_type: values.engine_type.trim(),
        command: values.command,
        cpu: String(values.cpu),
        memory: `${values.memory}Gi`,
        replicas: values.replicas,
        runtime_mode: values.runtime_mode,
        ...(distributed ? { worker_replicas: values.worker_replicas } : {}),
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
          model_id: initialModelId,
          model_version_id: initialModelId ? initialModelVersionId : undefined,
          replicas: 1,
          cpu: 8,
          memory: 32,
          runtime_mode: "RUNTIME_MODE_DEPLOYMENT",
          worker_replicas: 1,
        }}
      >
        <Form.Item field="name" label="名称" rules={required("请输入名称")}>
          <Input maxLength={63} placeholder="请输入名称" />
        </Form.Item>
        <Grid.Row gutter={16}>
          <Grid.Col span={12}>
            <Form.Item field="model_id" label="模型" rules={required("请选择模型")}>
              <ModelSelect
                onChange={(id) => {
                  setModelId(id);
                  changeVersion("");
                }}
              />
            </Form.Item>
          </Grid.Col>
          <Grid.Col span={12}>
            <Form.Item
              field="model_version_id"
              label="模型版本"
              rules={required("请选择已就绪的模型版本")}
            >
              <ModelVersionSelect key={modelId} modelId={modelId} onChange={changeVersion} />
            </Form.Item>
          </Grid.Col>
        </Grid.Row>
        <Form.Item label="引擎镜像" required extra="确认引擎类型和镜像">
          <Input.Group compact>
            <Form.Item
              field="engine_type"
              noStyle={{ showErrorTip: true }}
              rules={required("请选择引擎类型")}
            >
              <EngineSelect style={{ width: 140 }} />
            </Form.Item>
            <Form.Item
              field="engine_image"
              noStyle={{ showErrorTip: true }}
              rules={required("请输入运行镜像地址")}
            >
              <Input
                aria-label="运行镜像"
                style={{ width: "calc(100% - 140px)" }}
                placeholder="请输入运行镜像地址"
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item
          field="command"
          label="完整启动命令"
          rules={required("请输入完整启动命令")}
          extra="确认完整启动命令"
        >
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="请输入完整启动命令" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            field="cpu"
            label="CPU"
            rules={[{ required: true, message: "请输入 CPU 核数" }]}
          >
            <InputNumber min={1} precision={0} step={1} suffix="核" placeholder="请输入 CPU 核数" />
          </Form.Item>
          <Form.Item
            field="memory"
            label="内存"
            rules={[{ required: true, message: "请输入内存容量" }]}
          >
            <InputNumber min={1} precision={0} step={1} suffix="GiB" placeholder="请输入内存容量" />
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
          <InputNumber min={1} max={2147483647} precision={0} />
        </Form.Item>
        {distributed && (
          <Form.Item
            field="worker_replicas"
            label="每组 Worker 数"
            rules={[{ required: true, type: "number", min: 1, message: "请输入大于 0 的整数" }]}
          >
            <InputNumber min={1} max={2147483647} precision={0} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
