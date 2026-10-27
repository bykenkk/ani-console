// FIXME(governance-instance-create): 副本、密钥及直接指定 GPU 执行参数等旧能力无等价创建字段，不混入当前请求。
// TODO(governance-instance-create): 待正式契约补齐后逐项恢复；GPU 规格由实例预设及后端解析决定。
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Modal, Space } from "@arco-design/web-react";
import {
  createInstance,
  type InstanceEnvVar,
  type InstancePreset,
  type InstanceVolumeMount,
} from "@/api/instances";
import type { ImageRegistration } from "@/api/images";
import { WizardSteps } from "@/components/common";
import InstanceCreateBasicFields from "@/components/instances/InstanceCreateBasicFields";
import InstanceCreateResourceFields from "@/components/instances/InstanceCreateResourceFields";
import InstanceCreateSummary from "@/components/instances/InstanceCreateSummary";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";

type GpuContainerCreateModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

type GpuContainerCreateFormValues = {
  name: string;
  preset?: InstancePreset;
  image?: ImageRegistration;
  workspace_mount_path: string;
  volume_mounts: InstanceVolumeMount[];
  vpc_id: string;
  subnet_id: string;
  env: InstanceEnvVar[];
  labels: InstanceEnvVar[];
  annotations: InstanceEnvVar[];
};

const STEP_TITLES = ["基本信息", "资源配置", "摘要信息"];
const INITIAL_VALUES: GpuContainerCreateFormValues = {
  name: "",
  preset: undefined,
  image: undefined,
  workspace_mount_path: "/workspace",
  volume_mounts: [],
  vpc_id: "",
  subnet_id: "",
  env: [],
  labels: [],
  annotations: [],
};
const BASIC_FIELDS: (keyof GpuContainerCreateFormValues)[] = ["name", "preset", "image"];
const RESOURCE_FIELDS: (keyof GpuContainerCreateFormValues)[] = [
  "workspace_mount_path",
  "volume_mounts",
  "vpc_id",
  "subnet_id",
  "env",
  "labels",
  "annotations",
];

export default function GpuContainerCreateModal({
  onCancel,
  onCreated,
}: GpuContainerCreateModalProps) {
  const [form] = Form.useForm<GpuContainerCreateFormValues>();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const submitting = useRef(false);
  const [validating, setValidating] = useState(false);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: createInstance,
    meta: {
      feedback: {
        channel: "message",
        action: "创建 GPU 容器",
        successText: "创建已提交",
        errorFallback: "创建失败，请检查配置后重试",
      },
    },
    // TODO(gpu-container-create): 联调验证 GPU 预设、目录不可用提示、资格与配额校验及冻结规格；GPU 执行参数由后端解析。
    // TODO(container-task): 创建任务跟踪后续统一接入，当前仅提交请求并提示。
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["governance-instances"] });
      onCreated();
    },
  });
  const close = () => {
    if (!submitting.current) onCancel();
  };
  const next = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setValidating(true);
    try {
      await validateForm({
        validate: () => form.validate(step === 0 ? BASIC_FIELDS : RESOURCE_FIELDS),
      });
      setStep((current) => current + 1);
    } catch {
      // 统一表单校验负责字段及提交提示。
    } finally {
      submitting.current = false;
      setValidating(false);
    }
  };
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const currentValues = await validateForm<GpuContainerCreateFormValues>(form);
      const { image, preset } = currentValues;
      if (
        !preset ||
        preset.compute_type !== "gpu" ||
        !preset.enabled ||
        !preset.selectable ||
        !preset.gpu ||
        !image
      ) {
        setStep(0);
        showMessage({ type: "error", content: "镜像或预设已变化，请重新选择" });
        return;
      }
      const submitData = {
        name: currentValues.name.trim(),
        image_id: image.image_id,
        image_scope: image.scope,
        preset_id: preset.id,
        workspace_mount_path: currentValues.workspace_mount_path,
        volume_mounts: currentValues.volume_mounts.map((mount) => ({
          pvc_name: mount.pvc_name,
          mount_path: mount.mount_path,
          read_only: mount.read_only,
        })),
        network:
          currentValues.vpc_id && currentValues.subnet_id
            ? { vpc_id: currentValues.vpc_id, subnet_id: currentValues.subnet_id }
            : undefined,
        env: currentValues.env.map(({ name, value }) => ({ name, value })),
        labels: Object.fromEntries(currentValues.labels.map(({ name, value }) => [name, value])),
        annotations: Object.fromEntries(
          currentValues.annotations.map(({ name, value }) => [name, value]),
        ),
      };
      await create.mutateAsync(submitData);
    } catch {
      const errors = form.getFieldsError();
      if (Object.keys(errors).length) setStep(BASIC_FIELDS.some((field) => errors[field]) ? 0 : 1);
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title="创建 GPU 容器"
      style={{ width: 820 }}
      onCancel={close}
      footer={
        <Space>
          <Button onClick={close} disabled={create.isPending || validating}>
            取消
          </Button>
          {step > 0 && (
            <Button
              disabled={create.isPending || validating}
              onClick={() => setStep((current) => current - 1)}
            >
              上一步
            </Button>
          )}
          <Button
            type="primary"
            loading={create.isPending || validating}
            onClick={step === 2 ? submit : next}
          >
            {step === 2 ? "提交创建" : "下一步"}
          </Button>
        </Space>
      }
    >
      <WizardSteps
        current={step + 1}
        items={STEP_TITLES}
        size="small"
        className="mx-auto w-full max-w-160 shrink-0"
      />
      <Form<GpuContainerCreateFormValues>
        form={form}
        layout="vertical"
        initialValues={INITIAL_VALUES}
        className="pt-7"
        disabled={create.isPending}
        requiredSymbol={{ position: "end" }}
        onValuesChange={(changed) => setValues((current) => ({ ...current, ...changed }))}
      >
        <div hidden={step !== 0}>
          <InstanceCreateBasicFields computeType="gpu" />
        </div>
        <div hidden={step !== 1}>
          <InstanceCreateResourceFields
            values={values}
            onVpcChange={(id) => {
              form.setFieldsValue({ vpc_id: id, subnet_id: "" });
              setValues((current) => ({ ...current, vpc_id: id, subnet_id: "" }));
            }}
          />
        </div>
        {step === 2 && <InstanceCreateSummary values={values} />}
      </Form>
    </Modal>
  );
}
