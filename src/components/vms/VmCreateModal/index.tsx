import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form } from "@arco-design/web-react";
import {
  createVm,
  listVmMedia,
  type VmInitialDisk,
  type VmDns,
  type VmSourceKind,
} from "@/api/vms";
import type { InstancePreset } from "@/api/instances";
import type { NetworkSecurityGroup, NetworkSubnet, NetworkVPC } from "@/api/network";
import WizardModal from "@/components/common/WizardModal";
import { validateForm } from "@/lib/form";
import VmComputeFields from "./VmComputeFields";
import VmNetworkConfiguration from "./VmNetworkConfiguration";
import VmSystemFields from "./VmSystemFields";
import VmCreateSummary from "./VmCreateSummary";

type VmCreateModalProps = { onCancel: () => void; onCreated: () => void };
export type VmCreateFormValues = {
  name: string;
  preset?: InstancePreset;
  source_kind: VmSourceKind;
  media_key: string;
  system_disk_size_gb: number;
  data_disks: VmInitialDisk[];
  vpc_id: string;
  subnet_id: string;
  security_group_ids: string[];
  start_after_create: boolean;
  dns_mode: VmDns["mode"];
  nameservers: string[];
  login_method: "PASSWORD" | "SSH_PUBLIC_KEY" | "NONE";
  additional_credential: boolean;
  username: string;
  password: string;
  ssh_public_key: string;
};

const STEP_TITLES = ["基础配置", "网络与安全", "系统配置", "确认配置"];
type VmCreateFieldKey =
  | keyof VmCreateFormValues
  | `nameservers[${number}]`
  | `data_disks[${number}].${"name" | "size_gb"}`;
type VmCreateFieldValue = VmCreateFormValues[keyof VmCreateFormValues];
const INITIAL: VmCreateFormValues = {
  name: "",
  source_kind: "DISK_IMAGE",
  media_key: "",
  system_disk_size_gb: 30,
  data_disks: [],
  vpc_id: "",
  subnet_id: "",
  security_group_ids: [],
  start_after_create: false,
  dns_mode: "PLATFORM_DEFAULT",
  nameservers: [""],
  login_method: "PASSWORD",
  additional_credential: false,
  username: "",
  password: "",
  ssh_public_key: "",
};

export default function VmCreateModal({ onCancel, onCreated }: VmCreateModalProps) {
  const [form] = Form.useForm<VmCreateFormValues, VmCreateFieldValue, VmCreateFieldKey>();
  const [values, setValues] = useState(INITIAL);
  const [selectedVpc, setSelectedVpc] = useState<NetworkVPC>();
  const [selectedSubnet, setSelectedSubnet] = useState<NetworkSubnet>();
  const [selectedSecurityGroups, setSelectedSecurityGroups] = useState<
    Pick<NetworkSecurityGroup, "id" | "name">[]
  >([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorField, setErrorField] = useState<VmCreateFieldKey>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const validationLock = useRef(false);
  const qc = useQueryClient();
  const media = useQuery({
    queryKey: ["vm-media"],
    queryFn: ({ signal }) => listVmMedia(signal),
    meta: { errorNotification: { id: "vm-media", action: "云主机介质加载" } },
  });
  const selected = media.data?.items.find((item) => item.mediaKey === values.media_key);
  const canInitialize =
    selected?.kind === "DISK_IMAGE" &&
    selected.osFamily === "linux" &&
    selected.initializationCapability === "CLOUD_INIT_NOCLOUD";
  const dnsFields: VmCreateFieldKey[] =
    values.dns_mode === "CUSTOM"
      ? [
          "nameservers",
          ...values.nameservers.map((_, index): VmCreateFieldKey => `nameservers[${index}]`),
        ]
      : [];
  const initializeGuest = canInitialize && values.login_method !== "NONE";
  const usePassword =
    initializeGuest && (values.login_method === "PASSWORD" || values.additional_credential);
  const usePublicKey =
    initializeGuest && (values.login_method === "SSH_PUBLIC_KEY" || values.additional_credential);
  const stepFields: VmCreateFieldKey[][] = [
    [
      "name",
      "source_kind",
      "media_key",
      "preset",
      "system_disk_size_gb",
      "data_disks",
      ...values.data_disks.flatMap((_, index): VmCreateFieldKey[] => [
        `data_disks[${index}].name`,
        `data_disks[${index}].size_gb`,
      ]),
    ],
    ["vpc_id", "subnet_id", "security_group_ids", "dns_mode", ...dnsFields],
    [
      "start_after_create",
      ...(canInitialize ? ["login_method" as const] : []),
      ...(initializeGuest ? ["username" as const, "additional_credential" as const] : []),
      ...(usePassword ? ["password" as const] : []),
      ...(usePublicKey ? ["ssh_public_key" as const] : []),
    ],
  ];
  useEffect(() => {
    if (!errorField) return;
    form.scrollToField(errorField, { block: "nearest" });
    setErrorField(undefined);
  }, [form, step, errorField]);
  const changeStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const close = () => {
    if (!validationLock.current) onCancel();
  };
  const create = useMutation({
    mutationFn: createVm,
    meta: { feedback: { channel: "message", action: "创建云主机", successText: "创建已提交" } },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vms", "list"] });
      onCreated();
    },
  });
  const advance = async (submit = false) => {
    if (validationLock.current) return;
    validationLock.current = true;
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
      const source = media.data?.items.find((item) => item.mediaKey === current.media_key);
      if (!current.preset || !source || source.kind === "DRIVER_ISO") return;
      await create.mutateAsync({
        name: current.name.trim(),
        preset_id: current.preset.id,
        source_kind: source.kind,
        media_key: current.media_key,
        system_disk_size_gb: String(current.system_disk_size_gb),
        data_disks: current.data_disks.map((disk) => ({ ...disk, name: disk.name.trim() })),
        security_group_ids: current.security_group_ids,
        network: { vpc_id: current.vpc_id, subnet_id: current.subnet_id },
        start_after_create: current.start_after_create,
        dns:
          current.dns_mode === "CUSTOM"
            ? { mode: "CUSTOM", nameservers: current.nameservers.map((address) => address.trim()) }
            : { mode: "PLATFORM_DEFAULT" },
        guest_initialization:
          canInitialize && current.login_method !== "NONE"
            ? {
                username: current.username.trim(),
                password:
                  current.login_method === "PASSWORD" || current.additional_credential
                    ? current.password || undefined
                    : undefined,
                ssh_public_key:
                  current.login_method === "SSH_PUBLIC_KEY" || current.additional_credential
                    ? current.ssh_public_key.trim() || undefined
                    : undefined,
              }
            : undefined,
      });
    } catch {
      // 字段校验和提交结果统一反馈；返回首个错误字段所在步骤。
      const errors = form.getFieldsError();
      const errorStep = stepFields.findIndex((fields) => fields.some((field) => errors[field]));
      if (errorStep >= 0) {
        changeStep(errorStep);
        setErrorField(stepFields[errorStep].find((field) => errors[field]));
      }
    } finally {
      validationLock.current = false;
      setBusy(false);
    }
  };
  return (
    <WizardModal
      title="创建云主机"
      current={step + 1}
      steps={STEP_TITLES}
      busy={busy}
      scrollRef={scrollRef}
      onCancel={close}
      onStepChange={(next) => {
        if (!validationLock.current && next - 1 < step) changeStep(next - 1);
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
            {step === 3 ? "创建云主机" : "下一步"}
          </Button>
        </div>
      }
    >
      <Form<VmCreateFormValues, VmCreateFieldValue, VmCreateFieldKey>
        form={form}
        layout="vertical"
        initialValues={INITIAL}
        disabled={busy}
        wrapper="div"
        onValuesChange={(changed, next) => {
          const reset: Partial<VmCreateFormValues> = {};
          const clear: VmCreateFieldKey[] = [];
          if ("source_kind" in changed) reset.media_key = "";
          if ("source_kind" in changed || "media_key" in changed) {
            reset.login_method = "PASSWORD";
          }
          if (
            "source_kind" in changed ||
            "media_key" in changed ||
            ("login_method" in changed && next.login_method === "NONE")
          ) {
            reset.username = "";
            clear.push("username");
          }
          if ("source_kind" in changed || "media_key" in changed || "login_method" in changed) {
            reset.additional_credential = false;
            reset.password = "";
            reset.ssh_public_key = "";
            clear.push("password", "ssh_public_key");
          } else if ("additional_credential" in changed && !next.additional_credential) {
            if (next.login_method === "SSH_PUBLIC_KEY") {
              reset.password = "";
              clear.push("password");
            } else {
              reset.ssh_public_key = "";
              clear.push("ssh_public_key");
            }
          }
          if ("vpc_id" in changed) reset.subnet_id = "";
          if (clear.length) form.clearFields(clear);
          form.setFieldsValue(reset);
          setValues((current) => ({ ...current, ...next, ...reset }));
        }}
      >
        <div hidden={step !== 0}>
          <VmComputeFields
            values={values}
            media={media.data?.items ?? []}
            loading={media.isFetching}
          />
        </div>
        <div hidden={step !== 1}>
          <VmNetworkConfiguration
            values={values}
            disabled={busy}
            onVpcChange={(vpc) => {
              setSelectedVpc(vpc);
              setSelectedSubnet(undefined);
              form.setFieldValue("subnet_id", "");
            }}
            onSubnetChange={setSelectedSubnet}
            onSecurityGroupsChange={setSelectedSecurityGroups}
          />
        </div>
        <div hidden={step !== 2}>
          <VmSystemFields values={values} canInitialize={canInitialize} />
        </div>
      </Form>
      {step === 3 && (
        <VmCreateSummary
          values={values}
          media={selected}
          canInitialize={canInitialize}
          vpcName={selectedVpc?.name}
          subnetName={selectedSubnet?.name}
          securityGroups={selectedSecurityGroups}
        />
      )}
    </WizardModal>
  );
}
