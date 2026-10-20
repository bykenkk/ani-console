import type { ContainerStorageFormValues } from ".";

export function hasDuplicateContainerMountPath(values: ContainerStorageFormValues) {
  return Boolean(
    values.volume_id &&
    values.filesystem_id &&
    values.volume_mount_path.trim() &&
    values.volume_mount_path.trim() === values.filesystem_mount_path.trim(),
  );
}
