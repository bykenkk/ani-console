// 原组件/适配保留供未对齐能力复核，不能作为 governance 契约使用。
// TODO(governance-migration): 后端覆盖原字段后逐项对接，避免删除未支持的能力。
import { Button, Form, Input, Modal, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGpuSpecAvailability, listGpuSchedulingQueues } from "@/api/gpu-inventory";
import { listNetworkSecurityGroups, listNetworkSubnets, listNetworkVpcs } from "@/api/network";
import { listRegistryImages } from "@/api/registry";
import { listFilesystems } from "@/api/storage/filesystems";
import { listVolumes } from "@/api/storage/volumes";
import { WizardSteps } from "@/components/common";
import type { ContainerNetworkItem } from "@/components/instances/ContainerNetworkFields";
import { hasDuplicateContainerMountPath } from "@/components/instances/ContainerStorageFields/storage";

import { INITIAL_VALUES } from "../constants";
import { isGpuSpecSelectable } from "../utils";
import GpuContainerConfirmStep from "./GpuContainerConfirmStep";
import GpuContainerImageStep from "./GpuContainerImageStep";
import GpuContainerNetworkStorageStep from "./GpuContainerNetworkStorageStep";
import GpuContainerResourceStep from "./GpuContainerResourceStep";
import styles from "./index.module.css";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";
import type { GpuInstanceComputeSpec } from "@/lib/instances";

export type GpuContainerConfigurationFormValues = {
  name: string;
  image: string;
  spec_id: string;
  queue_name: string;
  compute_spec: GpuInstanceComputeSpec;
  replicas: string;
  vpc_id: string;
  subnet_id: string;
  env_text: string;
  volume_id: string;
  volume_mount_path: string;
  volume_read_only: boolean;
  filesystem_id: string;
  filesystem_mount_path: string;
  filesystem_read_only: boolean;
  auto_start: boolean;
};

export type RegistryImage = {
  image: string;
  name?: string | null;
  purpose?: string;
  project: string;
  repository: string;
  tag: string;
  size_bytes?: number;
};

export type Filesystem = {
  id: string;
  name?: string;
  size_gib?: number;
  protocol?: string;
};

export type Volume = {
  id: string;
  name?: string | null;
};

type GpuSpecAvailability = {
  spec_id: string;
  status: "available" | "full" | "device_full" | "unavailable";
  available_count: number;
  has_matching_nodes: boolean;
  has_idle_devices: boolean;
  device_idle_count: number;
  gpu_count?: number;
};

export type GpuSpecAvailabilityListResponse = {
  items: GpuSpecAvailability[];
  quota_remaining: number;
};

export type GpuSpecOption = {
  spec_id: string;
  display_name: string;
  gpu_type?: string;
  gpu_mode?: "wholecard" | "vgpu";
  shares?: number;
  source: "api" | "temporary";
  availability?: GpuSpecAvailability;
};

type GpuSchedulingQueue = {
  id: string;
  name: string;
  workload_class: "inference" | "training" | "batch";
  is_platform_default: boolean;
  status?: {
    state?: "open" | "closed" | "unknown";
  } | null;
};

type GpuSchedulingQueueListResponse = {
  items: GpuSchedulingQueue[];
  total: number;
  next_cursor?: string | null;
};

export type ExtendedCreateRequest = {
  name: string;
  kind: "gpu_container";
  instance_type: "gpu_container";
  image: string;
  image_ref: string;
  cpu: string;
  memory: string;
  auto_start: boolean;
  termination_protection: boolean;
  gpu_container_config: {
    network: {
      vpc_id: string;
      subnet_id: string;
      security_group_ids: string[];
    };
    replicas: number;
    gpu: {
      spec_id: string;
      queue_name: string;
    };
    env: Array<{ name: string; value: string }>;
    volume_mounts: Array<{
      volume_id: string;
      mount_path: string;
      read_only: boolean;
    }>;
    filesystem_mounts: Array<{
      filesystem_id: string;
      mount_path: string;
      read_only: boolean;
    }>;
  };
};

const listVpcOptions = withFirst100(listNetworkVpcs);

const STEP_TITLES = ["基本信息", "资源配置", "摘要信息"];

type GpuContainerCreateFormProps = {
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: GpuContainerConfigurationFormValues, securityGroupId: string) => void;
};

export default function GpuContainerCreateForm({
  submitting,
  onCancel,
  onSubmit,
}: GpuContainerCreateFormProps) {
  const [form] = Form.useForm<GpuContainerConfigurationFormValues>();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<GpuContainerConfigurationFormValues>(INITIAL_VALUES);
  const vpcs = useQuery({
    meta: {
      errorNotification: {
        id: "vpcs",
        action: "VPC 列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpcs", "select", "options"],
    queryFn: () => listVpcOptions({}),
  });
  const subnets = useQuery({
    meta: {
      errorNotification: {
        id: "subnets",
        action: "子网列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-subnets", "select", values.vpc_id],
    // TODO(instance-option-pagination): 子网选项仍沿用后端 limit/cursor 过渡契约，待分页改造完成后改为 page=1、pageSize=100；不增加翻页入口。
    queryFn: () => listNetworkSubnets({ vpc_id: values.vpc_id || undefined }),
    enabled: !!values.vpc_id,
  });
  const securityGroups = useQuery({
    meta: {
      errorNotification: {
        id: "security-groups",
        action: "安全组列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-security-groups", "select"],
    // TODO(instance-option-pagination): 安全组选项仍沿用后端 limit/cursor 过渡契约，待分页改造完成后改为 page=1、pageSize=100；不增加翻页入口。
    queryFn: () => listNetworkSecurityGroups(),
  });
  const filesystems = useQuery({
    meta: {
      errorNotification: {
        id: "filesystems",
        action: "文件存储列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["filesystems", "select"],
    // TODO(instance-option-pagination): 文件存储选项仍沿用后端 limit/cursor 过渡契约，待分页改造完成后改为 page=1、pageSize=100；不增加翻页入口。
    queryFn: () => listFilesystems(),
  });
  const volumes = useQuery({
    meta: {
      errorNotification: {
        id: "volumes",
        action: "块存储卷列表加载",
        fallback: "加载失败，请稍后重试",
      },
    },
    queryKey: ["volumes", "gpu-container-create", "filesystem"],
    // TODO(instance-option-pagination): 云盘选项仍沿用后端 limit/cursor 过渡契约，待分页改造完成后改为 page=1、pageSize=100；不增加翻页入口。
    queryFn: () => listVolumes({ in_use: false, volume_mode: "filesystem" }),
  });
  const images = useQuery({
    meta: {
      errorNotification: {
        id: withId("registry-images", "gpu"),
        action: "GPU 容器镜像加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["registry-images", "gpu-create"],
    // TODO(instance-option-pagination): 仓库镜像选项仍沿用后端 limit/cursor 过渡契约，待分页改造完成后改为 page=1、pageSize=100；不增加翻页入口。
    queryFn: async () => (await listRegistryImages({ purpose: "gpu" })).items,
  });
  const gpuSpecAvailability = useQuery({
    meta: {
      errorNotification: {
        id: "gpu-specs",
        action: "GPU 规格加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["gpu-specs", "availability"],
    queryFn: getGpuSpecAvailability,
  });
  const gpuSchedulingQueues = useQuery({
    meta: {
      errorNotification: {
        id: "gpu-queues",
        action: "GPU 调度队列加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["gpu-scheduling", "queues", "select"],
    queryFn: async () =>
      (await listGpuSchedulingQueues()) as unknown as GpuSchedulingQueueListResponse,
  });

  const defaultSecurityGroup = values.vpc_id
    ? (securityGroups.data?.items ?? []).find((item) => item.vpc_id === values.vpc_id)
    : undefined;
  const selectedImage = images.data?.find((item) => item.image === values.image);
  const selectedFilesystem = (filesystems.data?.items ?? []).find(
    (item) => String(item.id) === values.filesystem_id,
  ) as Filesystem | undefined;
  const selectedVolume = (volumes.data?.items ?? []).find(
    (item) => String(item.id) === values.volume_id,
  ) as Volume | undefined;
  const apiGpuSpecs = gpuSpecAvailability.data?.items ?? [];
  const gpuSpecs: GpuSpecOption[] = apiGpuSpecs.map((spec) => ({
    spec_id: spec.spec_id,
    display_name: spec.spec_id,
    source: "api" as const,
    availability: spec,
  }));
  const schedulingQueues = (gpuSchedulingQueues.data?.items ?? []) as GpuSchedulingQueue[];
  const selectedGpuSpec = gpuSpecs.find((item) => item.spec_id === values.spec_id);
  const defaultSchedulingQueue =
    schedulingQueues.find((item) => item.is_platform_default && item.status?.state !== "closed") ??
    schedulingQueues.find((item) => item.status?.state !== "closed");
  const hasAvailableGpuSpec = gpuSpecs.some(isGpuSpecSelectable);
  const hasAvailableQueue = defaultSchedulingQueue !== undefined;

  const next = async () => {
    if (step === 1 && hasDuplicateContainerMountPath(values)) {
      showMessage({ type: "warning", content: "请为块存储卷和文件存储设置不同的挂载路径" });
      return;
    }
    try {
      await validateForm(form);
    } catch {
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1));
  };

  const setFieldValue = (
    field: keyof GpuContainerConfigurationFormValues,
    value: string | boolean,
  ) => {
    form.setFieldValue(field, value);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    if (hasDuplicateContainerMountPath(values)) {
      setStep(1);
      showMessage({ type: "warning", content: "请为块存储卷和文件存储设置不同的挂载路径" });
      return;
    }
    onSubmit(
      { ...values, queue_name: defaultSchedulingQueue?.name ?? "" },
      String(defaultSecurityGroup?.id ?? ""),
    );
  };

  return (
    <Modal
      title="创建 GPU 容器"
      visible
      onCancel={onCancel}
      unmountOnExit
      footer={
        <Space>
          <Button onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          {step > 0 ? (
            <Button onClick={() => setStep((current) => current - 1)} disabled={submitting}>
              上一步
            </Button>
          ) : null}
          <Button
            type="primary"
            onClick={step === STEP_TITLES.length - 1 ? submit : next}
            loading={submitting}
            disabled={
              step === 0 &&
              (!images.data?.length ||
                gpuSpecAvailability.isLoading ||
                gpuSchedulingQueues.isLoading ||
                gpuSpecAvailability.isError ||
                gpuSchedulingQueues.isError ||
                !hasAvailableGpuSpec ||
                !hasAvailableQueue)
            }
          >
            {step === STEP_TITLES.length - 1 ? "提交创建" : "下一步"}
          </Button>
        </Space>
      }
      style={{ width: 820 }}
    >
      <div className="flex flex-col">
        <WizardSteps current={step + 1} items={STEP_TITLES} size="small" className={styles.steps} />
        <div className="pt-7">
          <Form<GpuContainerConfigurationFormValues>
            form={form}
            layout="vertical"
            initialValues={INITIAL_VALUES}
            requiredSymbol={{ position: "end" }}
            onValuesChange={(changedValues) =>
              setValues((current) => ({ ...current, ...changedValues }))
            }
          >
            {step === 0 ? (
              <>
                <Form.Item
                  field="name"
                  label="名称"
                  rules={[{ required: true, message: "请输入名称" }]}
                >
                  <Input allowClear />
                </Form.Item>
                <GpuContainerImageStep images={images.data ?? []} loading={images.isLoading} />
                <GpuContainerResourceStep
                  values={values}
                  specs={gpuSpecs}
                  quotaRemaining={gpuSpecAvailability.data?.quota_remaining ?? 0}
                  specsLoading={gpuSpecAvailability.isLoading}
                />
              </>
            ) : null}
            {step === 1 ? (
              <GpuContainerNetworkStorageStep
                onFieldValueChange={setFieldValue}
                values={values}
                vpcs={(vpcs.data?.items ?? []) as ContainerNetworkItem[]}
                subnets={(subnets.data?.items ?? []) as ContainerNetworkItem[]}
                volumes={(volumes.data?.items ?? []) as Volume[]}
                filesystems={(filesystems.data?.items ?? []) as Filesystem[]}
                defaultSecurityGroup={defaultSecurityGroup as ContainerNetworkItem | undefined}
                networkLoading={vpcs.isLoading || subnets.isLoading}
              />
            ) : null}
            {step === 2 ? (
              <GpuContainerConfirmStep
                values={values}
                image={selectedImage}
                volume={selectedVolume}
                filesystem={selectedFilesystem}
                gpuSpec={selectedGpuSpec}
                securityGroupName={String(defaultSecurityGroup?.name ?? "平台自动配置")}
              />
            ) : null}
          </Form>
        </div>
      </div>
    </Modal>
  );
}
