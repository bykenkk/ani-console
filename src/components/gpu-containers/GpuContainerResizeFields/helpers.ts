// FIXME(governance-instance-resize): GPU 变配仍依赖原 compute、GPU 规格及 lifecycle 参数，保留原组件和适配。
// TODO(governance-instance-resize): 等等价变配契约齐备后迁移，不用新创建预设替代旧变配请求。
import { type InstanceRecord } from "@/api/instances/legacy";
import { GPU_INSTANCE_COMPUTE_SPECS } from "@/lib/instances";

type Instance = InstanceRecord;

export const CURRENT_GPU_SPEC_VALUE = "__current_gpu_spec__";

export type GpuContainerResizeFormValues = {
  gpu_spec_id?: string;
  cpu_memory_spec?: string;
};

export function currentCpuMemorySpec(instance: Instance) {
  const cpu = String(instance.compute?.cpu ?? "").replace(/C$/i, "");
  const memory = String(instance.compute?.memory ?? "");
  if (!cpu || !memory) return GPU_INSTANCE_COMPUTE_SPECS[0].value;

  return `${cpu}C${memory.replace(/Gi$/i, "G")}`;
}

export function currentGpuSpecValue(instance: Instance) {
  return instance.compute?.spec_id || CURRENT_GPU_SPEC_VALUE;
}

export function getGpuContainerResizeInitialValues(
  instance: Instance,
): GpuContainerResizeFormValues {
  return {
    gpu_spec_id: currentGpuSpecValue(instance),
    cpu_memory_spec: currentCpuMemorySpec(instance),
  };
}

export function buildGpuContainerResizeFields(values: GpuContainerResizeFormValues) {
  const cpuSpec = GPU_INSTANCE_COMPUTE_SPECS.find(
    (option) => option.value === values.cpu_memory_spec,
  );
  const [cpu, memory] = values.cpu_memory_spec?.match(/^(\d+)C(\d+)G$/i)?.slice(1) ?? [];

  return {
    cpu: cpuSpec?.cpu ?? cpu,
    memory: cpuSpec?.memory ?? (memory ? `${memory}Gi` : undefined),
    spec_id: values.gpu_spec_id === CURRENT_GPU_SPEC_VALUE ? undefined : values.gpu_spec_id,
  };
}

export function isGpuContainerResizeUnchanged(
  instance: Instance,
  values: GpuContainerResizeFormValues,
) {
  const initialValues = getGpuContainerResizeInitialValues(instance);
  return (
    values.gpu_spec_id === initialValues.gpu_spec_id &&
    values.cpu_memory_spec === initialValues.cpu_memory_spec
  );
}
