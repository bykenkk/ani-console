import type { InstanceConfigurationData } from "@/api/instances";

export function validatePvcMountPath(path: string, configuration?: InstanceConfigurationData) {
  if (
    !path.startsWith("/") ||
    path === "/" ||
    ["\0", "\r", "\n"].some((character) => path.includes(character)) ||
    path.endsWith("/") ||
    path.includes("//") ||
    path.split("/").some((part) => part === "." || part === "..")
  ) {
    return "请输入规范的绝对路径，不能为根目录或包含相对路径片段";
  }
  const protectedPaths = [
    "/bin",
    "/sbin",
    "/usr",
    "/etc",
    "/proc",
    "/sys",
    "/dev",
    "/var/run",
    "/run",
    "/lib",
    "/lib64",
  ];
  const covers = (parent: string, child: string) =>
    child === parent || child.startsWith(`${parent}/`);
  if (protectedPaths.some((protectedPath) => covers(protectedPath, path)))
    return "不能挂载到系统受保护目录";
  const existing = [
    configuration?.workspace_mount_path,
    ...(configuration?.volume_mounts ?? []).map((mount) => mount.mount_path),
  ].filter((value): value is string => Boolean(value));
  if (existing.some((mounted) => covers(mounted, path) || covers(path, mounted)))
    return "不能与工作目录或已有挂载路径相互遮盖";
  return undefined;
}
