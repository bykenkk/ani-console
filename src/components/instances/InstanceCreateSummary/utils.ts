import type { InstancePreset } from "@/api/instances";

export function getGpuPresetSummaryItems(preset?: InstancePreset) {
  if (preset?.compute_type !== "gpu" || !preset.gpu) return [];
  const gpu = preset.gpu;
  const mode =
    gpu.mode === "WHOLE_EXCLUSIVE"
      ? "整卡独占"
      : gpu.mode === "SHARED_FIXED"
        ? "共享固定配额"
        : gpu.mode;
  // GPU 字段只展示目录返回值；不推算显存、不转换 int64 精度，也不作为独立参数提交。
  return [
    { label: "GPU 型号", value: gpu.model_key },
    { label: "GPU 模式", value: mode },
    { label: "GPU 设备数", value: gpu.devices_per_instance },
    { label: "单设备显存", value: gpu.memory_mib_per_device + " MiB" },
    { label: "总显存", value: gpu.memory_mib_total + " MiB" },
    { label: "GPU 算力上限", value: gpu.core_limit_percent + "%" },
  ];
}
