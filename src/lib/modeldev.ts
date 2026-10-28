import type {
  ModelDevExecution,
  ModelDevInputVersion,
  ModelDevParameterRule,
} from "@/api/modeldev";
import type { InstancePreset } from "@/api/instances";
import { parseDateTime } from "@/lib/date";

/** CLOSED 已关闭，NEEDS_REVIEW 等待人工处理；停止观测不代表已释放算力。 */
export function shouldObserveModelDevExecution(task: ModelDevExecution): boolean {
  return task.close_state !== "CLOSED" && task.close_state !== "NEEDS_REVIEW";
}

export function canResumeModelDevRegistration(task: ModelDevExecution): boolean {
  return (
    task.kind === "FINETUNING" &&
    task.close_state === "CLOSED" &&
    (task.model_registration?.state === "PENDING" ||
      task.model_registration?.state === "DEPENDENCY_UNAVAILABLE")
  );
}

const PARAMETER_LABELS: Record<string, string> = {
  epochs: "训练轮次",
  batch_size: "批次大小",
  learning_rate: "学习率",
  max_steps: "最大训练步数",
  per_device_train_batch_size: "每设备批次大小",
  gradient_accumulation_steps: "梯度累积步数",
  cutoff_len: "最大序列长度",
  lora_rank: "LoRA Rank",
  lora_alpha: "LoRA Alpha",
  lora_dropout: "LoRA Dropout",
  seed: "随机种子",
};

export function getModelDevParameterLabel(name: string): string {
  return PARAMETER_LABELS[name] || name;
}

export function getModelDevParameterError(
  rule: ModelDevParameterRule,
  value: string | undefined,
): string | undefined {
  if (rule.editable === false) return;
  if (value === undefined || value === "") return rule.required ? "请填写此参数" : undefined;
  if (rule.allowed_values?.length && !rule.allowed_values.some((item) => item.value === value))
    return "请选择允许的参数值";
  if (rule.type === "INTEGER") {
    if (!/^-?\d+$/.test(value)) return "请输入整数";
    if (!Number.isSafeInteger(Number(value))) return "整数超出可精确提交的范围";
    const integer = BigInt(value);
    if (rule.minimum && integer < BigInt(rule.minimum.value))
      return `不能小于 ${rule.minimum.value}`;
    if (rule.minimum && rule.minimum_inclusive === false && integer === BigInt(rule.minimum.value))
      return `必须大于 ${rule.minimum.value}`;
    if (rule.maximum && integer > BigInt(rule.maximum.value))
      return `不能大于 ${rule.maximum.value}`;
    if (rule.maximum && rule.maximum_inclusive === false && integer === BigInt(rule.maximum.value))
      return `必须小于 ${rule.maximum.value}`;
  }
  if (rule.type === "DECIMAL") {
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value)))
      return "请输入普通十进制小数，不支持科学计数法";
    if (value.length > 32) return "最多输入 32 个字符";
    const decimal = Number(value);
    if (rule.minimum && decimal < Number(rule.minimum.value))
      return `不能小于 ${rule.minimum.value}`;
    if (rule.minimum && rule.minimum_inclusive === false && decimal === Number(rule.minimum.value))
      return `必须大于 ${rule.minimum.value}`;
    if (rule.maximum && decimal > Number(rule.maximum.value))
      return `不能大于 ${rule.maximum.value}`;
    if (rule.maximum && rule.maximum_inclusive === false && decimal === Number(rule.maximum.value))
      return `必须小于 ${rule.maximum.value}`;
    if (
      rule.numeric_representation === "float32_positive_finite" &&
      (!Number.isFinite(Math.fround(decimal)) || Math.fround(decimal) <= 0)
    )
      return "请输入可表示的大于 0 的小数";
    // TODO(modeldev-rules): 联调核对目录的开闭区间和可编辑规则；模型相关上限仍由后端校验。
  }
}

export function formatModelDevInputVersion(version: ModelDevInputVersion): string {
  return `${version.input_version_id} · ${version.format || "-"}`;
}

export function formatModelDevComputeResources(
  preset: Pick<InstancePreset, "cpu_millis" | "memory_mib"> | null | undefined,
): string {
  if (!preset) return "-";
  return `${preset.cpu_millis} mCPU / ${preset.memory_mib} MiB`;
}

/** 从首个实际执行步骤到关闭完成；未关闭时仅展示截至服务端观测时间的时长。 */
export function formatModelDevExecutionDuration(task: ModelDevExecution): string {
  const startedAt = task.steps.find((step) => step.role !== "close" && step.started_at)?.started_at;
  const finishedAt = task.steps.find((step) => step.role === "close")?.finished_at;
  const endedAt = finishedAt || (task.close_state !== "CLOSED" ? task.observed_at : undefined);
  if (!startedAt || !endedAt) return "-";

  const elapsed = parseDateTime(endedAt).getTime() - parseDateTime(startedAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "-";

  const seconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) return `${hours} 小时 ${minutes} 分 ${remainingSeconds} 秒`;
  if (minutes > 0) return `${minutes} 分 ${remainingSeconds} 秒`;
  return `${remainingSeconds} 秒`;
}
