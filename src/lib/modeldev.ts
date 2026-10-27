import type {
  ModelDevExecution,
  ModelDevInputVersion,
  ModelDevParameterRule,
} from "@/api/modeldev";
import type { InstancePreset } from "@/api/instances";

/** CLOSED 已关闭，NEEDS_REVIEW 等待人工处理；停止观测不代表已释放算力。 */
export function shouldObserveModelDevExecution(task: ModelDevExecution): boolean {
  return task.close_state !== "CLOSED" && task.close_state !== "NEEDS_REVIEW";
}

const PARAMETER_LABELS: Record<string, string> = {
  epochs: "训练轮次",
  batch_size: "批次大小",
  learning_rate: "学习率",
  seed: "随机种子",
};

export function getModelDevParameterLabel(name: string): string {
  return PARAMETER_LABELS[name] || name;
}

export function getModelDevParameterError(
  rule: ModelDevParameterRule,
  value: string | undefined,
): string | undefined {
  if (value === undefined || value === "") return rule.required ? "请填写此参数" : undefined;
  if (rule.allowed_values?.length && !rule.allowed_values.some((item) => item.value === value))
    return "请选择允许的参数值";
  if (rule.type === "INTEGER") {
    if (!/^-?\d+$/.test(value)) return "请输入整数";
    const integer = BigInt(value);
    if (rule.minimum && integer < BigInt(rule.minimum.value))
      return `不能小于 ${rule.minimum.value}`;
    if (rule.maximum && integer > BigInt(rule.maximum.value))
      return `不能大于 ${rule.maximum.value}`;
  }
  if (rule.type === "DECIMAL") {
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value)))
      return "请输入普通十进制小数，不支持科学计数法";
    if (value.length > 32) return "最多输入 32 个字符";
    const decimal = Number(value);
    if (rule.minimum && decimal < Number(rule.minimum.value))
      return `不能小于 ${rule.minimum.value}`;
    if (rule.maximum && decimal > Number(rule.maximum.value))
      return `不能大于 ${rule.maximum.value}`;
    if (
      rule.numeric_representation === "float32_positive_finite" &&
      (!Number.isFinite(Math.fround(decimal)) || Math.fround(decimal) <= 0)
    )
      return "请输入可表示的大于 0 的小数";
    // TODO(modeldev-rules): 目录尚无结构化开区间标记；其他排他边界及模型相关上限仍由后端校验。
  }
}

export function formatModelDevInputVersion(version: ModelDevInputVersion): string {
  return `${version.input_version_id} · ${version.format || "-"}`;
}

export function formatModelDevComputeResources(preset: InstancePreset | undefined): string {
  if (!preset) return "-";
  return `${preset.cpu_millis} mCPU / ${preset.memory_mib} MiB`;
}
