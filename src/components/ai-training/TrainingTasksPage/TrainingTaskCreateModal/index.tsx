import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Space } from "@arco-design/web-react";
import type { ModelDevImplementation, ModelDevInputVersion } from "@/api/modeldev";
import type { InstancePreset } from "@/api/instances";
import WizardModal from "@/components/common/WizardModal";
import ModelDevParameterFields from "@/components/ai-training/ModelDevParameterFields";
import { validateForm } from "@/lib/form";
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

export default function TrainingTaskCreateModal({ onCancel }: TrainingTaskCreateModalProps) {
  const [form] = Form.useForm<TrainingTaskCreateFormValues, TrainingFieldValue, TrainingFieldKey>();
  const [values, setValues] = useState(initialValues);
  const [implementation, setImplementation] = useState<ModelDevImplementation>();
  const [inputVersion, setInputVersion] = useState<ModelDevInputVersion>();
  const [step, setStep] = useState(1);
  const [validating, setValidating] = useState(false);
  const [errorField, setErrorField] = useState<TrainingFieldKey>();
  const validationLock = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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
  const nextStep = async () => {
    if (validationLock.current) return;
    validationLock.current = true;
    setValidating(true);
    const fields = step === 1 ? basicFields : [...basicFields, ...parameterFields];
    try {
      await validateForm({
        validate: () => form.validate(fields),
      });
      changeStep(step + 1);
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
            <Button type="primary" loading={validating} onClick={nextStep}>
              下一步
            </Button>
          ) : (
            // TODO(modeldev-create): 创建提交暂缓；恢复时使用新实现/算力目录及 parameters，整数与 timeout_seconds 按第 7 节使用 JSON 数字。
            <Button type="primary" disabled>
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
          if ("implementation_id" in changed) {
            if (parameterFields.length) form.clearFields(parameterFields);
            form.setFieldValue("parameters", []);
            setImplementation(undefined);
            setValues((current) => ({ ...current, ...next, parameters: [] }));
          } else setValues((current) => ({ ...current, ...next }));
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
          onEdit={(index) => changeStep(index + 1)}
        />
      )}
    </WizardModal>
  );
}
