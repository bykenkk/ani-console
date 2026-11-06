// FIXME(governance-instance-create): 副本、密钥及自定义 GPU 执行参数尚无等价创建字段。
// TODO(governance-instance-create): 正式契约补齐后逐项恢复；GPU 参数仍由所选规格解析。
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Form } from "@arco-design/web-react";
import {
  createInstance,
  type InstanceEnvVar,
  type InstancePreset,
  type InstanceVolumeMount,
} from "@/api/instances";
import type { ImageRegistration } from "@/api/images";
import type { NetworkSecurityGroup, NetworkSubnet, NetworkVPC } from "@/api/network";
import WizardModal from "@/components/common/WizardModal";
import { validateForm } from "@/lib/form";
import ContainerBasicFields from "@/components/instances/ContainerBasicFields";
import ContainerResourceFields from "@/components/instances/ContainerResourceFields";
import ContainerRuntimeFields from "@/components/instances/ContainerRuntimeFields";
import ContainerSummary from "@/components/instances/ContainerSummary";
import { buildContainerCreateInput } from "./utils";

type GpuContainerCreateModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};
export type GpuContainerCreateFormValues = {
  name: string;
  preset?: InstancePreset;
  image?: ImageRegistration;
  network_enabled: boolean;
  vpc_id: string;
  subnet_id: string;
  security_group_ids: string[];
  workspace_mount_path: string;
  volume_mounts: InstanceVolumeMount[];
  env: InstanceEnvVar[];
  labels: InstanceEnvVar[];
  annotations: InstanceEnvVar[];
};
type ContainerCreateFieldKey =
  | keyof GpuContainerCreateFormValues
  | `volume_mounts[${number}].${keyof InstanceVolumeMount}`
  | `${"env" | "labels" | "annotations"}[${number}].${keyof InstanceEnvVar}`;
type ContainerCreateFieldValue = GpuContainerCreateFormValues[keyof GpuContainerCreateFormValues];
const STEPS = ["基础配置", "网络与存储", "运行配置", "确认配置"];
const INITIAL: GpuContainerCreateFormValues = {
  name: "",
  network_enabled: false,
  vpc_id: "",
  subnet_id: "",
  security_group_ids: [],
  workspace_mount_path: "/workspace",
  volume_mounts: [],
  env: [],
  labels: [],
  annotations: [],
};

export default function GpuContainerCreateModal({
  onCancel,
  onCreated,
}: GpuContainerCreateModalProps) {
  const [form] = Form.useForm<
    GpuContainerCreateFormValues,
    ContainerCreateFieldValue,
    ContainerCreateFieldKey
  >();
  const [values, setValues] = useState(INITIAL);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorField, setErrorField] = useState<ContainerCreateFieldKey>();
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [vpc, setVpc] = useState<NetworkVPC>();
  const [subnet, setSubnet] = useState<NetworkSubnet>();
  const [securityGroups, setSecurityGroups] = useState<Pick<NetworkSecurityGroup, "id" | "name">[]>(
    [],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const qc = useQueryClient();
  const title = "创建 GPU 容器";
  const stepFields: ContainerCreateFieldKey[][] = [
    ["name", "image", "preset"],
    [
      "network_enabled",
      "workspace_mount_path",
      "volume_mounts",
      ...(values.network_enabled
        ? ["vpc_id" as const, "subnet_id" as const, "security_group_ids" as const]
        : []),
      ...values.volume_mounts.flatMap((_, i): ContainerCreateFieldKey[] => [
        `volume_mounts[${i}].pvc_name`,
        `volume_mounts[${i}].mount_path`,
        `volume_mounts[${i}].read_only`,
      ]),
    ],
    (["env", "labels", "annotations"] as const).flatMap((field): ContainerCreateFieldKey[] => [
      field,
      ...values[field].flatMap((_, i): ContainerCreateFieldKey[] => [
        `${field}[${i}].name`,
        `${field}[${i}].value`,
      ]),
    ]),
  ];
  useEffect(() => {
    if (!errorField) return;
    form.scrollToField(errorField, { block: "nearest" });
    setErrorField(undefined);
  }, [form, step, errorField, metadataExpanded]);
  const changeStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const close = () => {
    if (!lock.current) onCancel();
  };
  const create = useMutation({
    mutationFn: createInstance,
    meta: {
      feedback: {
        channel: "message",
        action: title,
        successText: "创建已提交",
        errorFallback: "创建失败，请检查配置后重试",
      },
    },
    // TODO(container-task): 创建任务跟踪后续统一接入。
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["instances", "gpu"] });
      onCreated();
    },
  });
  const advance = async (submit = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const current = await validateForm({
        validate: async () => {
          await form.validate(submit ? stepFields.flat() : stepFields[step]);
          return { ...INITIAL, ...form.getFieldsValue() };
        },
      });
      if (!submit) {
        changeStep(step + 1);
        return;
      }
      await create.mutateAsync(buildContainerCreateInput(current));
    } catch {
      const errors = form.getFieldsError();
      const errorStep = stepFields.findIndex((fields) => fields.some((field) => errors[field]));
      if (errorStep >= 0) {
        const field = stepFields[errorStep].find((key) => errors[key]);
        if (field?.startsWith("labels") || field?.startsWith("annotations"))
          setMetadataExpanded(true);
        changeStep(errorStep);
        setErrorField(field);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <WizardModal
      title={title}
      current={step + 1}
      steps={STEPS}
      busy={busy}
      onCancel={close}
      scrollRef={scrollRef}
      onStepChange={(next) => {
        if (!lock.current && next - 1 < step) changeStep(next - 1);
      }}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={close} disabled={busy}>
            取消
          </Button>
          {step > 0 && (
            <Button onClick={() => changeStep(step - 1)} disabled={busy}>
              上一步
            </Button>
          )}
          <Button type="primary" loading={busy} onClick={() => advance(step === 3)}>
            {step === 3 ? title : "下一步"}
          </Button>
        </div>
      }
    >
      <Form<GpuContainerCreateFormValues, ContainerCreateFieldValue, ContainerCreateFieldKey>
        form={form}
        layout="vertical"
        initialValues={INITIAL}
        disabled={busy}
        wrapper="div"
        onValuesChange={(changed, next) => {
          const reset: Partial<GpuContainerCreateFormValues> = {};
          if ("vpc_id" in changed) {
            reset.subnet_id = "";
            setSubnet(undefined);
          }
          form.setFieldsValue(reset);
          setValues((current) => ({ ...current, ...next, ...reset }));
        }}
      >
        <div hidden={step !== 0}>
          <ContainerBasicFields computeType="gpu" />
        </div>
        <div hidden={step !== 1}>
          <ContainerResourceFields
            values={values}
            onVpcChange={setVpc}
            onSubnetChange={setSubnet}
            onSecurityGroupsChange={setSecurityGroups}
          />
        </div>
        <div hidden={step !== 2}>
          <ContainerRuntimeFields
            metadataExpanded={metadataExpanded}
            onMetadataExpandedChange={setMetadataExpanded}
          />
        </div>
      </Form>
      {step === 3 && (
        <ContainerSummary
          values={values}
          vpcName={vpc?.name}
          subnetName={subnet?.name}
          securityGroups={securityGroups}
        />
      )}
    </WizardModal>
  );
}
