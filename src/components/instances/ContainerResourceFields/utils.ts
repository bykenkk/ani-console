import type { InstanceEnvVar, InstanceVolumeMount } from "@/api/instances";

export function validateMountPath(path: string): string | undefined {
  if (
    !path ||
    !path.startsWith("/") ||
    path === "/" ||
    path
      .split("/")
      .slice(1)
      .some((part) => !part || part === "." || part === "..")
  ) {
    return "请输入规范的绝对路径，例如 /workspace";
  }
}

export function validateVolumeMounts(
  mounts: InstanceVolumeMount[],
  workspacePath: string,
): string | undefined {
  if (mounts.length > 8) return "最多添加 8 个挂载";
  const paths = [workspacePath];
  for (const mount of mounts) {
    if (!mount.pvc_name) return "请选择存储卷";
    if (validateMountPath(mount.mount_path)) return "请输入规范的挂载路径，例如 /data";
    if (
      paths.some(
        (path) =>
          path === mount.mount_path ||
          path.startsWith(`${mount.mount_path}/`) ||
          mount.mount_path.startsWith(`${path}/`),
      )
    ) {
      return "挂载路径不能相同或互为父子目录，也不能与工作目录重叠";
    }
    paths.push(mount.mount_path);
  }
}

export function validateKeyValues(rows: InstanceEnvVar[], maxItems: number): string | undefined {
  if (rows.length > maxItems) return `最多添加 ${maxItems} 项`;
  if (rows.some((row) => !row.name || row.name.trim() !== row.name))
    return "名称不能为空或包含首尾空格";
  if (new Set(rows.map((row) => row.name)).size !== rows.length) return "名称不能重复";
}

export function validateConfigSize(rows: InstanceEnvVar[]): string | undefined {
  if (new Blob(rows.flatMap((row) => [row.name, row.value])).size > 16 * 1024)
    return "配置内容不能超过 16 KiB";
}
