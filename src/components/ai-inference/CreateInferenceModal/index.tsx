import { Form, Grid, Input, InputNumber, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { createInferenceService, type InferenceRuntimeMode } from "@/api/inference";
import type { ModelVersion } from "@/api/models";
import type { InstancePreset } from "@/api/instances";
import InstanceComputeSelect from "@/components/instances/InstanceComputeSelect";
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
  preset?: InstancePreset;
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
  const servedModelName = useRef<{ modelId: string; modelName: string; value: string }>();
  const [preset, setPreset] = useState<InstancePreset>();
  const [distributed, setDistributed] = useState(false);
  const [modelId, setModelId] = useState(initialModelId ?? "");
  const [modelName, setModelName] = useState("");
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
    // TODO(inference-model-config): 联调模型参数预填、用户修改及切换版本；提交采用用户确认的表单值。
    mutationFn: createInferenceService,
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
      if (!modelName) {
        showMessage({ type: "error", content: "模型名称尚未加载，请稍后重试" });
        return;
      }

      if (!values.preset?.enabled || !values.preset.selectable) {
        showMessage({ type: "error", content: "请选择可用的推理算力规格" });
        return;
      }
      if (
        values.preset.compute_type === "gpu" &&
        values.runtime_mode === "RUNTIME_MODE_LEADER_WORKER_SET"
      ) {
        showMessage({ type: "error", content: "GPU 推理暂不支持 LeaderWorkerSet" });
        return;
      }

      // 同一次部署失败后再次提交时复用名称，避免改变幂等请求内容。
      if (
        servedModelName.current?.modelId !== modelId ||
        servedModelName.current.modelName !== modelName
      ) {
        servedModelName.current = {
          modelId,
          modelName,
          value: `${modelName}-${randomString(7)}`,
        };
      }

      await create.mutateAsync({
        name: values.name.trim(),
        model_version_id: version.id,
        served_model_name: servedModelName.current.value,
        engine_image: values.engine_image.trim(),
        engine_type: values.engine_type.trim(),
        command: values.command,
        preset_id: values.preset.id,
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
        <Form.Item label="引擎镜像" required>
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
        {/* FIXME(inference-model-name): 命令中的模型名可能与自动生成的服务模型名不一致；若网关未做名称映射，外部调用可能失败，待核对后处理。 */}
        <Form.Item field="command" label="完整启动命令" rules={required("请输入完整启动命令")}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="请输入完整启动命令" />
        </Form.Item>
        <Form.Item
          field="preset"
          label="算力规格"
          validateTrigger="onSelect"
          rules={[{ required: true, message: "请选择推理算力规格" }]}
        >
          <InstanceComputeSelect
            usage="INFERENCE"
            onTypeChange={() => form.setFields({ preset: { error: undefined } })}
            onChange={(selected) => {
              setPreset(selected);
              if (selected?.compute_type === "gpu") {
                setDistributed(false);
                form.setFieldsValue({
                  runtime_mode: "RUNTIME_MODE_DEPLOYMENT",
                  worker_replicas: undefined,
                });
              }
            }}
          />
        </Form.Item>
        <Form.Item
          field="runtime_mode"
          label="运行模式"
          rules={[{ type: "string", required: true }]}
        >
          <Select
            options={[
              { value: "RUNTIME_MODE_DEPLOYMENT", label: "Deployment" },
              {
                value: "RUNTIME_MODE_LEADER_WORKER_SET",
                label: "LeaderWorkerSet（分布式）",
                disabled: preset?.compute_type === "gpu",
              },
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
