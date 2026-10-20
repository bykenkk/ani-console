import { GPU_INSTANCE_COMPUTE_SPECS } from "@/lib/instances";
import type {
  ExtendedCreateRequest,
  GpuContainerConfigurationFormValues,
  GpuSpecOption,
} from "./GpuContainerCreateForm";

export function isGpuSpecSelectable(spec: GpuSpecOption) {
  // TODO(gpu-spec-quota): 租户配额校验修复后，删除 full 分支并恢复仅 available 可选。
  if (spec.availability?.status === "full") return true;

  return (
    spec.source === "temporary" ||
    (spec.availability?.status === "available" && spec.availability.available_count > 0)
  );
}

function parseEnv(text: string) {
  return text
    .split(/\r?\n|\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separator = item.indexOf("=");
      return separator > 0
        ? { name: item.slice(0, separator), value: item.slice(separator + 1) }
        : null;
    })
    .filter((item): item is { name: string; value: string } => item !== null);
}

export function buildCreateRequest(
  values: GpuContainerConfigurationFormValues,
  securityGroupId: string,
): ExtendedCreateRequest {
  const computeSpec =
    GPU_INSTANCE_COMPUTE_SPECS.find((option) => option.value === values.compute_spec) ??
    GPU_INSTANCE_COMPUTE_SPECS[0];
  return {
    name: values.name.trim(),
    kind: "gpu_container",
    instance_type: "gpu_container",
    image: values.image,
    image_ref: values.image,
    cpu: computeSpec.cpu,
    memory: computeSpec.memory,
    auto_start: values.auto_start,
    termination_protection: false,
    gpu_container_config: {
      network: {
        vpc_id: values.vpc_id,
        subnet_id: values.subnet_id,
        security_group_ids: securityGroupId ? [securityGroupId] : [],
      },
      replicas: Number(values.replicas) || 1,
      gpu: {
        spec_id: values.spec_id,
        queue_name: values.queue_name,
      },
      env: parseEnv(values.env_text),
      volume_mounts: values.volume_id
        ? [
            {
              volume_id: values.volume_id,
              mount_path: values.volume_mount_path.trim(),
              read_only: values.volume_read_only,
            },
          ]
        : [],
      filesystem_mounts:
        values.filesystem_id && values.filesystem_mount_path
          ? [
              {
                filesystem_id: values.filesystem_id,
                mount_path: values.filesystem_mount_path,
                read_only: values.filesystem_read_only,
              },
            ]
          : [],
    },
  };
}
