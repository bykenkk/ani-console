import type { InstanceEnvVar } from "@/api/instances";

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

export function validateConfigSize(rows: InstanceEnvVar[]): string | undefined {
  if (new Blob(rows.flatMap((row) => [row.name, row.value])).size > 16 * 1024)
    return "配置内容不能超过 16 KiB";
}
