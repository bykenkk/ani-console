import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Form, Space } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InstancePreset } from "@/api/instances";
import {
  createFineTuningExecution,
  type ModelDevImplementation,
  type ModelDevInputVersion,
} from "@/api/modeldev";
import type { Model, ModelVersion } from "@/api/models";
import WizardModal from "@/components/common/WizardModal";
import { validateForm } from "@/lib/form";
import FineTuningBasicFields from "./FineTuningBasicFields";
import ModelDevParameterFields from "@/components/ai-training/ModelDevParameterFields";
import FineTuningSummary from "./FineTuningSummary";
import { buildFineTuningParameters } from "./utils";
import { useFineTuningReadiness } from "@/hooks/useFineTuningReadiness";
import FineTuningReadinessFields from "./FineTuningReadinessFields";

type CreateFineTuningModalProps = { onCancel: () => void };

export type CreateFineTuningFormValues = {
  name: string;
  preset?: InstancePreset;
  method: string;
  baseModelId: string;
  baseModelVersionId: string;
  registrationMode: "none" | "existing" | "new";
  targetModelId: string;
  newModelName: string;
  dataset: string;
  parameters: string[];
  finetuning_template: string;
};

const STEP_TITLES = ["基础信息", "参数配置", "摘要信息"];
const STEP_FIELDS: (keyof CreateFineTuningFormValues)[][] = [
  [
    "name",
    "baseModelId",
    "baseModelVersionId",
    "preset",
    "method",
    "dataset",
    "registrationMode",
    "finetuning_template",
  ],
  [],
];

const INITIAL_VALUES: CreateFineTuningFormValues = {
  name: "",
  preset: undefined,
  method: "",
  baseModelId: "",
  baseModelVersionId: "",
  registrationMode: "none",
  targetModelId: "",
  newModelName: "",
  dataset: "",
  parameters: [],
  finetuning_template: "",
};

type FineTuningFieldKey = keyof CreateFineTuningFormValues | `parameters[${number}]`;
type FineTuningFieldValue = CreateFineTuningFormValues[keyof CreateFineTuningFormValues];

export default function CreateFineTuningModal({ onCancel }: CreateFineTuningModalProps) {
  const qc = useQueryClient();
  const [form] = Form.useForm<
    CreateFineTuningFormValues,
    FineTuningFieldValue,
    FineTuningFieldKey
  >();
  const [values, setValues] = useState<CreateFineTuningFormValues>(INITIAL_VALUES);
  const [implementation, setImplementation] = useState<ModelDevImplementation>();
  const [inputVersion, setInputVersion] = useState<ModelDevInputVersion>();
  const [baseModel, setBaseModel] = useState<Model>();
  const [targetModel, setTargetModel] = useState<Model>();
  const [baseVersion, setBaseVersion] = useState<ModelVersion>();
  const [step, setStep] = useState(0);
  const [validating, setValidating] = useState(false);
  const [errorField, setErrorField] = useState<FineTuningFieldKey>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const validationLock = useRef(false);
  const readinessInput =
    baseVersion?.id === values.baseModelVersionId &&
    baseVersion.status.toLowerCase() === "ready" &&
    values.preset?.enabled &&
    values.preset.selectable &&
    implementation?.available &&
    implementation.implementation_id === values.method
      ? {
          base_model_version_id: values.baseModelVersionId,
          compute_preset_id: values.preset.id,
          ...(values.finetuning_template
            ? { finetuning_template: values.finetuning_template }
            : {}),
        }
      : undefined;
  const readiness = useFineTuningReadiness(readinessInput);
  const assessment = readiness.isError ? undefined : readiness.data;
  useEffect(() => {
    if (readiness.isFetching || assessment?.assessment === "ELIGIBLE") {
      form.setFields({ finetuning_template: { error: undefined } });
    }
  }, [form, readiness.isFetching, assessment?.assessment]);
  const create = useMutation({
    mutationFn: createFineTuningExecution,
    retry: false,
    meta: {
      feedback: {
        channel: "message",
        action: "创建微调任务",
        successText: "微调任务创建已提交",
        errorFallback: "创建失败，请稍后重试",
      },
    },
    onSuccess: async () => {
      // 统一失效执行列表缓存，覆盖按 kind 分开的训练与微调查询。
      await qc.invalidateQueries({ queryKey: ["training-executions"] });
      // TODO(finetuning-task): 后续统一接入创建任务跟踪，当前受理成功后关闭表单。
      onCancel();
    },
  });
  const parameterFields = (implementation?.parameter_rules ?? []).map(
    (_, index): FineTuningFieldKey => `parameters[${index}]`,
  );
  const stepFields: FineTuningFieldKey[][] = STEP_FIELDS.map((fields, index) => {
    if (index === 1) return [...fields, ...parameterFields];
    if (index === 0 && values.registrationMode === "existing") return [...fields, "targetModelId"];
    if (index === 0 && values.registrationMode === "new") return [...fields, "newModelName"];
    return fields;
  });
  const changeBaseVersion = useCallback(
    (id: string, selected?: ModelVersion) => {
      if (id !== form.getFieldValue("baseModelVersionId")) {
        form.clearFields(["finetuning_template"]);
        setValues((current) => ({ ...current, finetuning_template: "" }));
      }
      form.setFieldValue("baseModelVersionId", id);
      setValues((current) => ({ ...current, baseModelVersionId: id }));
      setBaseVersion(selected);
    },
    [form],
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
    if (validationLock.current) return;
    onCancel();
  };
  const validate = async (all: boolean, submit = false) => {
    if (validationLock.current) return;
    validationLock.current = true;
    setValidating(true);
    try {
      const submitted = await validateForm({
        validate: async () => {
          const submitted = {
            ...INITIAL_VALUES,
            ...(await form.validate(all ? stepFields.flat() : stepFields[step])),
          };
          if (submit) {
            const errors: Partial<
              Record<keyof CreateFineTuningFormValues, { error: { message: string } }>
            > = {};
            if (
              !implementation ||
              implementation.implementation_id !== submitted.method ||
              !implementation.available ||
              implementation.kind !== "FINETUNING"
            )
              errors.method = { error: { message: "请选择当前可用的微调技术" } };
            if (!submitted.preset?.enabled || !submitted.preset.selectable) {
              errors.preset = { error: { message: "请选择可用的训练算力规格" } };
            } else if (
              implementation?.supported_device_modes?.length &&
              !implementation.supported_device_modes.includes(submitted.preset.compute_type)
            )
              errors.preset = { error: { message: "所选微调技术不支持此算力类型" } };
            if (
              !baseVersion ||
              baseVersion.id !== submitted.baseModelVersionId ||
              baseVersion.status.toLowerCase() !== "ready"
            )
              errors.baseModelVersionId = { error: { message: "请选择已就绪的模型版本" } };
            if (
              !inputVersion ||
              inputVersion.input_version_id !== submitted.dataset ||
              inputVersion.state !== "READY" ||
              inputVersion.format !== "JSON"
            )
              errors.dataset = { error: { message: "请选择已就绪的 JSON 数据集版本" } };
            if (Object.keys(errors).length) {
              form.setFields(errors);
              throw new Error("微调提交选项校验失败");
            }
          }
          return submitted;
        },
      });
      if (submit && implementation && submitted.preset) {
        await create.mutateAsync({
          name: submitted.name,
          kind: "FINETUNING",
          implementation_id: submitted.method,
          compute_preset_id: submitted.preset.id,
          dataset_version_id: submitted.dataset,
          base_model_version_id: submitted.baseModelVersionId,
          ...(submitted.registrationMode === "existing"
            ? { target_model_id: submitted.targetModelId }
            : submitted.registrationMode === "new"
              ? { new_model_name: submitted.newModelName }
              : {}),
          parameters: buildFineTuningParameters(implementation, submitted.parameters),
          ...(submitted.finetuning_template
            ? { finetuning_template: submitted.finetuning_template }
            : {}),
        });
      } else if (!submit) changeStep(step + 1);
    } catch {
      // 表单错误由统一校验入口提示；接口失败由 mutation feedback 提示并保留表单。
      const errors = form.getFieldsError();
      const errorStep = stepFields.findIndex((fields) => fields.some((field) => errors[field]));
      if (errorStep >= 0) {
        const field = stepFields[errorStep].find((key) => errors[key]);
        changeStep(errorStep);
        setErrorField(field);
      }
    } finally {
      validationLock.current = false;
      setValidating(false);
    }
  };

  return (
    <WizardModal
      title="创建微调任务"
      current={step + 1}
      steps={STEP_TITLES}
      busy={validating}
      scrollRef={scrollRef}
      onStepChange={(next) => {
        if (next - 1 < step && !validating) changeStep(next - 1);
      }}
      onCancel={close}
      footer={
        <Space>
          <Button onClick={close} disabled={validating}>
            取消
          </Button>
          {step > 0 && (
            <Button onClick={() => changeStep(step - 1)} disabled={validating}>
              上一步
            </Button>
          )}
          {step < 2 ? (
            <Button type="primary" loading={validating} onClick={() => validate(step === 1)}>
              下一步
            </Button>
          ) : (
            <Button type="primary" loading={validating} onClick={() => validate(true, true)}>
              创建
            </Button>
          )}
        </Space>
      }
    >
      <Form<CreateFineTuningFormValues, FineTuningFieldValue, FineTuningFieldKey>
        form={form}
        layout="vertical"
        initialValues={INITIAL_VALUES}
        disabled={validating}
        wrapper="div"
        onValuesChange={(changed, next) => {
          const reset: Partial<CreateFineTuningFormValues> = {};
          const deviceModeChanged =
            "preset" in changed && next.preset?.compute_type !== values.preset?.compute_type;
          if (deviceModeChanged) {
            form.clearFields(["method"]);
            reset.method = "";
          }
          if ("method" in changed || deviceModeChanged) {
            if (parameterFields.length) form.clearFields(parameterFields);
            reset.parameters = [];
            setImplementation(undefined);
          }
          if ("baseModelId" in changed) {
            form.clearFields(["baseModelVersionId"]);
            reset.baseModelVersionId = "";
            setBaseVersion(undefined);
          }
          if (
            "baseModelId" in changed ||
            "baseModelVersionId" in changed ||
            "method" in changed ||
            ("preset" in changed && next.preset?.id !== values.preset?.id)
          ) {
            form.clearFields(["finetuning_template"]);
            reset.finetuning_template = "";
          }
          if ("registrationMode" in changed) {
            form.clearFields(["targetModelId", "newModelName"]);
            reset.targetModelId = "";
            reset.newModelName = "";
            setTargetModel(undefined);
          }
          form.setFieldsValue(reset);
          setValues((current) => ({ ...current, ...next, ...reset }));
        }}
      >
        <div hidden={step !== 0}>
          <FineTuningBasicFields
            values={values}
            onImplementationSelect={setImplementation}
            onInputSelect={setInputVersion}
            onBaseModelSelect={setBaseModel}
            onTargetModelSelect={setTargetModel}
            onBaseVersionChange={changeBaseVersion}
          />
          <FineTuningReadinessFields
            readiness={assessment}
            checking={readiness.isFetching}
            enabled={!!readinessInput}
          />
        </div>
        <div hidden={step !== 1}>
          <Card bordered={false}>
            <ModelDevParameterFields
              key={implementation?.implementation_id}
              implementation={implementation}
              contextLimit={assessment?.context_limit}
            />
          </Card>
        </div>
      </Form>
      {step === 2 && (
        <FineTuningSummary
          values={values}
          computePreset={values.preset}
          implementation={implementation}
          baseVersion={baseVersion}
          baseModel={baseModel}
          targetModel={targetModel}
          inputVersion={inputVersion}
          readiness={assessment}
        />
      )}
    </WizardModal>
  );
}
