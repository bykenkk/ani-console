import type { Sandbox } from "@/api/sandboxes";
import { formatBytes } from "@/lib/format";

export function sandboxComputeText(sandbox: Sandbox) {
  const snapshot = sandbox.snapshot;
  if (!snapshot?.cpu_millis || !snapshot.memory_mib) return "-";
  return `${Number(snapshot.cpu_millis) / 1000}C / ${formatBytes(Number(snapshot.memory_mib) * 1024 ** 2)}`;
}
