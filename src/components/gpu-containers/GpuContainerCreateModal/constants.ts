import { DEFAULT_GPU_INSTANCE_COMPUTE_SPEC } from "@/lib/instances";
import type { GpuContainerConfigurationFormValues, GpuSpecOption } from "./GpuContainerCreateForm";

// TODO: /gpu-specs/availability 返回真实规格后删除临时选项，完全迁移到接口数据。
export const TEMPORARY_RTX4090_GPU_SPEC_OPTIONS: GpuSpecOption[] = [
  {
    spec_id: "rtx-4090-48g-1",
    display_name: "RTX 4090 · 整卡",
    gpu_type: "NVIDIA-GeForce-RTX-4090",
    gpu_mode: "wholecard",
    shares: 1,
    source: "temporary",
  },
  {
    spec_id: "rtx4090-12g-4",
    display_name: "RTX 4090 · vGPU（4 份）",
    gpu_type: "NVIDIA-GeForce-RTX-4090",
    gpu_mode: "vgpu",
    shares: 4,
    source: "temporary",
  },
];

export const INITIAL_VALUES: GpuContainerConfigurationFormValues = {
  name: "",
  image: "",
  spec_id: "",
  queue_name: "",
  compute_spec: DEFAULT_GPU_INSTANCE_COMPUTE_SPEC,
  replicas: "1",
  vpc_id: "",
  subnet_id: "",
  env_text: "",
  volume_id: "",
  volume_mount_path: "/data",
  volume_read_only: false,
  filesystem_id: "",
  filesystem_mount_path: "/data",
  filesystem_read_only: false,
  auto_start: true,
};
