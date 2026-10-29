import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Space } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTrainingExecution,
  type ModelDevImplementation,
  type ModelDevInputVersion,
} from "@/api/modeldev";
import type { InstancePreset } from "@/api/instances";
import WizardModal from "@/components/common/WizardModal";
import ModelDevParameterFields from "@/components/ai-training/ModelDevParameterFields";
import { validateForm } from "@/lib/form";
import { buildModelDevParameters } from "@/lib/modeldev";
import TrainingTaskSummary from "./TrainingTaskSummary";
import TrainingTaskBasicFields from "./TrainingTaskBasicFields";

type TrainingTaskCreateModalProps = {
  onCancel: () => void;
  onCreated?: () => void;
};

export interface TrainingTaskCreateFormValues {
  name: string;
  implementation_id: string;
  preset?: InstancePreset;
  dataset_version_id: string;
  parameters: string[];
}

type TrainingFieldKey = keyof TrainingTaskCreateFormValues | `parameters[${number}]`;
type TrainingFieldValue = TrainingTaskCreateFormValues[keyof TrainingTaskCreateFormValues];
const steps = ["基础信息", "参数配置", "摘要信息"];
const initialValues: TrainingTaskCreateFormValues = {
  name: "",
  implementation_id: "",
  preset: undefined,
  dataset_version_id: "",
  parameters: [],
};
const basicFields: TrainingFieldKey[] = [
  "name",
  "preset",
  "implementation_id",
  "dataset_version_id",
];

export default function TrainingTaskCreateModal({
  onCancel,
  onCreated,
}: TrainingTaskCreateModalProps) {
  const qc = useQueryClient();
  const [form] = Form.useForm<TrainingTaskCreateFormValues, TrainingFieldValue, TrainingFieldKey>();
  const [values, setValues] = useState(initialValues);
  const [implementation, setImplementation] = useState<ModelDevImplementation>();
  const [inputVersion, setInputVersion] = useState<ModelDevInputVersion>();
  const [step, setStep] = useState(1);
  const [validating, setValidating] = useState(false);
  const [errorField, setErrorField] = useState<TrainingFieldKey>();
  const validationLock = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const create = useMutation({
    mutationFn: createTrainingExecution,
    retry: false,
    meta: {
      feedback: {
        channel: "message",
        action: "创建训练任务",
        successText: "训练任务创建已提交",
        errorFallback: "创建失败，请稍后重试",
      },
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["training-executions"] });
      // TODO(training-task): 后续统一接入创建任务跟踪，当前受理成功后关闭表单。
      onCreated?.();
      onCancel();
    },
  });
  const parameterFields = (implementation?.parameter_rules ?? []).map(
    (_, index): TrainingFieldKey => `parameters[${index}]`,
  );
  useEffect(() => {
    if (!errorField) return;
    form.scrollToField(errorField, { block: "center", behavior: "smooth" });
    setErrorField(undefined);
  }, [errorField, form, step]);

  const changeStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const close = () => {
    if (!validationLock.current) onCancel();
  };
  const nextStep = async (submit = false) => {
    if (validationLock.current) return;
    validationLock.current = true;
    setValidating(true);
    const fields = !submit && step === 1 ? basicFields : [...basicFields, ...parameterFields];
    try {
      const submitted = await validateForm({
        validate: async () => {
          const submitted = { ...initialValues, ...(await form.validate(fields)) };
          if (submit) {
            const errors: Partial<Record<TrainingFieldKey, { error: { message: string } }>> = {};
            if (
              !implementation ||
              implementation.implementation_id !== submitted.implementation_id ||
              !implementation.available ||
              implementation.kind !== "GENERAL_TRAINING"
            )
              errors.implementation_id = { error: { message: "请选择当前可用的训练方法" } };
            if (
              !submitted.preset?.enabled ||
              !submitted.preset.selectable ||
              (implementation?.supported_device_modes?.length &&
                !implementation.supported_device_modes.includes(submitted.preset.compute_type))
            )
              errors.preset = { error: { message: "请选择训练方法支持的可用算力规格" } };
            if (
              !inputVersion ||
              inputVersion.input_version_id !== submitted.dataset_version_id ||
              inputVersion.state !== "READY" ||
              inputVersion.format !== "CSV"
            )
              errors.dataset_version_id = { error: { message: "请选择已就绪的 CSV 数据集版本" } };
            if (Object.keys(errors).length) {
              form.setFields(errors);
              throw new Error("训练提交选项校验失败");
            }
          }
          return submitted;
        },
      });
      if (submit && implementation && submitted.preset) {
        await create.mutateAsync({
          name: submitted.name,
          kind: "GENERAL_TRAINING",
          implementation_id: submitted.implementation_id,
          compute_preset_id: submitted.preset.id,
          dataset_version_id: submitted.dataset_version_id,
          parameters: buildModelDevParameters(implementation, submitted.parameters),
        });
      } else if (!submit) changeStep(step + 1);
    } catch {
      const errors = form.getFieldsError();
      const field = fields.find((key) => errors[key]);
      if (field) {
        changeStep(basicFields.includes(field) ? 1 : 2);
        setErrorField(field);
      }
    } finally {
      validationLock.current = false;
      setValidating(false);
    }
  };
  return (
    <WizardModal
      title="创建训练任务"
      current={step}
      steps={steps}
      busy={validating}
      scrollRef={scrollRef}
      onStepChange={(next) => {
        if (next < step && !validating) changeStep(next);
      }}
      onCancel={close}
      footer={
        <Space>
          <Button disabled={validating} onClick={close}>
            取消
          </Button>
          {step > 1 && (
            <Button disabled={validating} onClick={() => changeStep(step - 1)}>
              上一步
            </Button>
          )}
          {step < steps.length ? (
            <Button type="primary" loading={validating} onClick={() => nextStep()}>
              下一步
            </Button>
          ) : (
            <Button type="primary" loading={validating} onClick={() => nextStep(true)}>
              创建
            </Button>
          )}
        </Space>
      }
    >
      <Form<TrainingTaskCreateFormValues, TrainingFieldValue, TrainingFieldKey>
        form={form}
        disabled={validating}
        layout="vertical"
        initialValues={initialValues}
        wrapper="div"
        onValuesChange={(changed, next) => {
          const reset: Partial<TrainingTaskCreateFormValues> = {};
          const deviceModeChanged =
            "preset" in changed && next.preset?.compute_type !== values.preset?.compute_type;
          if (deviceModeChanged) {
            form.clearFields(["implementation_id"]);
            reset.implementation_id = "";
          }
          if ("implementation_id" in changed || deviceModeChanged) {
            if (parameterFields.length) form.clearFields(parameterFields);
            reset.parameters = [];
            setImplementation(undefined);
          }
          form.setFieldsValue(reset);
          setValues((current) => ({ ...current, ...next, ...reset }));
        }}
      >
        <div hidden={step !== 1}>
          <TrainingTaskBasicFields
            values={values}
            onImplementationSelect={setImplementation}
            onInputSelect={setInputVersion}
          />
        </div>
        <div hidden={step !== 2}>
          <Card bordered={false}>
            <ModelDevParameterFields
              key={implementation?.implementation_id}
              implementation={implementation}
            />
          </Card>
        </div>
      </Form>
      {step === 3 && (
        <TrainingTaskSummary
          values={values}
          implementation={implementation}
          computePreset={values.preset}
          inputVersion={inputVersion}
        />
      )}
    </WizardModal>
  );
}
