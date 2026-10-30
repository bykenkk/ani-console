import type { CreateInstanceInput } from "@/api/instances";
import type { ContainerCreateFormValues } from ".";

export function buildContainerCreateInput(values: ContainerCreateFormValues): CreateInstanceInput {
  const { image, preset } = values;
  if (!image || !preset) throw new Error("请选择镜像和实例预设");
  return {
    name: values.name.trim(),
    image_id: image.image_id,
    image_scope: image.scope,
    preset_id: preset.id,
    workspace_mount_path: values.workspace_mount_path,
    volume_mounts: values.volume_mounts.map((mount) => ({
      pvc_name: mount.pvc_name,
      mount_path: mount.mount_path,
      read_only: mount.read_only,
    })),
    security_group_ids: values.security_group_ids,
    network:
      values.vpc_id && values.subnet_id
        ? { vpc_id: values.vpc_id, subnet_id: values.subnet_id }
        : undefined,
    env: values.env.map(({ name, value }) => ({ name, value })),
    labels: Object.fromEntries(values.labels.map(({ name, value }) => [name, value])),
    annotations: Object.fromEntries(values.annotations.map(({ name, value }) => [name, value])),
  };
}
