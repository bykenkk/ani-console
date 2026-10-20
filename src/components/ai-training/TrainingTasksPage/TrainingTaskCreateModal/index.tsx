// FIXME(modeldev-integration): 提交限制为 GENERAL_TRAINING，且固定省略 epochs/batch_size；不能直接适配交接文档描述的未来微调预设。
// TODO(modeldev-integration): 后端统一 CPU-P01 与扩展阶段约束后，将 kind 和可提交参数规则一起调整，保留省略与 [] 的不同意图。
// FIXME(training-ui): 当前创建弹窗使用三步向导，与项目默认单页表单约定不同。
// TODO(training-ui): 按确认后的交互要求收敛为单页，或明确保留分步流程的需求依据。
import { useRef, useState } from "react";
import { Button, Form, Modal, Space } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { WizardSteps } from "@/components/common";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";
import {
  createModelDevExecution,
  type ModelDevPreset,
  type ModelDevInputVersion,
  type CreateModelDevExecutionInput,
  getModelDevInputVersion,
} from "@/api/modeldev";
import TrainingPresetFields from "./TrainingPresetFields";
import TrainingTaskSummary, { type TrainingCreateValues } from "./TrainingTaskSummary";
import TrainingTaskBasicFields from "./TrainingTaskBasicFields";
import styles from "./index.module.css";

const steps = ["基础信息", "参数配置", "摘要信息"];
const initialValues: TrainingCreateValues = {
  name: "",
  preset_id: "",
  dataset_version_id: "",
  parameters: [],
};

export default function TrainingTaskCreateModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated?: () => void;
}) {
  const [form] = Form.useForm<TrainingCreateValues>();
  const [values, setValues] = useState(initialValues);
  const [preset, setPreset] = useState<ModelDevPreset>();
  const [dataset, setDataset] = useState<ModelDevInputVersion>();
  const [step, setStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const create = useMutation({
    mutationFn: async (input: CreateModelDevExecutionInput) => {
      const current = await getModelDevInputVersion(input.dataset_version_id);
      if (current.state !== "READY") throw new Error("数据集尚未就绪，请重新选择");
      await createModelDevExecution(input);
    },
    meta: {
      feedback: {
        channel: "message",
        action: "创建训练任务",
        successText: "训练任务创建已提交",
        errorFallback: "创建失败，请稍后重试",
      },
    },
    onSuccess: () => {
      onCreated?.();
      onCancel();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const submitted = await validateForm<TrainingCreateValues>(form);
      if (
        preset?.kind !== "GENERAL_TRAINING" ||
        !preset.new_submissions_enabled ||
        !preset.active_release_id ||
        submitted.preset_id !== preset.preset_id ||
        dataset?.state !== "READY" ||
        submitted.dataset_version_id !== dataset.input_version_id
      ) {
        showMessage({ type: "error", content: "请选择可用的训练预设和已就绪的数据集" });
        return;
      }
      const parameters = (preset.parameter_rules ?? []).flatMap((rule, index) => {
        // CPU-P01 固定参数由 Release 提供，创建契约禁止显式传入。
        if (rule.name === "epochs" || rule.name === "batch_size") return [];
        const value = submitted.parameters[index] ?? rule.default_value?.value;
        return value?.trim() ? [{ name: rule.name, type: rule.type, value }] : [];
      });
      await create.mutateAsync({
        name: submitted.name.trim(),
        kind: preset.kind,
        preset_id: submitted.preset_id,
        dataset_version_id: submitted.dataset_version_id,
        ...(submitted.image_version_id ? { image_version_id: submitted.image_version_id } : {}),
        ...(parameters.length ? { general_parameters: parameters } : {}),
      });
    } catch {
      // 字段校验与请求错误分别由统一校验入口和 mutation feedback 展示。
    } finally {
      submitting.current = false;
    }
  };
  const changeStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const nextStep = async () => {
    try {
      if (step === 1) {
        await validateForm({
          validate: () => form.validate(["name", "preset_id", "dataset_version_id"]),
        });
        if (
          !preset?.new_submissions_enabled ||
          !preset.active_release_id ||
          dataset?.state !== "READY"
        ) {
          showMessage({ type: "error", content: "请选择可用的训练预设和已就绪的数据集" });
          return;
        }
      } else {
        await validateForm(form);
      }
      setValues((current) => ({ ...current, ...form.getFieldsValue() }));
      changeStep(step + 1);
    } catch {
      // 统一入口已显示校验反馈。
    }
  };
  return (
    <Modal
      visible
      title="创建训练任务"
      style={{ width: 960, maxWidth: "calc(100vw - 48px)" }}
      className={styles.modal}
      closable={!create.isPending}
      escToExit={!create.isPending}
      onCancel={onCancel}
      footer={
        <Space>
          <Button disabled={create.isPending} onClick={onCancel}>
            取消
          </Button>
          {step > 1 && (
            <Button disabled={create.isPending} onClick={() => changeStep(step - 1)}>
              上一步
            </Button>
          )}
          {step < steps.length ? (
            <Button type="primary" onClick={nextStep}>
              下一步
            </Button>
          ) : (
            <Button type="primary" loading={create.isPending} onClick={submit}>
              创建
            </Button>
          )}
        </Space>
      }
    >
      <div className="shrink-0 px-4 pb-5">
        <WizardSteps current={step} items={steps} className={styles.steps} />
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <Form
          form={form}
          disabled={create.isPending}
          layout="vertical"
          initialValues={initialValues}
          onValuesChange={(_, next) => setValues((current) => ({ ...current, ...next }))}
        >
          <div hidden={step !== 1}>
            <TrainingTaskBasicFields
              preset={preset}
              dataset={dataset}
              onDatasetChange={setDataset}
              onPresetChange={(selected) => {
                setPreset(selected);
                const parameters = (selected.parameter_rules ?? []).map(
                  (rule) => rule.default_value?.value ?? "",
                );
                form.setFieldsValue({ parameters, image_version_id: undefined });
                setValues((current) => ({
                  ...current,
                  preset_id: selected.preset_id,
                  parameters,
                  image_version_id: undefined,
                }));
              }}
            />
          </div>
          <div hidden={step !== 2}>
            <TrainingPresetFields preset={preset} />
          </div>
          {step === 3 && <TrainingTaskSummary values={values} preset={preset} />}
        </Form>
      </div>
    </Modal>
  );
}
