export const IMAGE_PURPOSES = [
  { value: "container", label: "容器" },
  { value: "development", label: "开发" },
  { value: "inference", label: "推理" },
  { value: "finetuning", label: "微调" },
  { value: "training", label: "训练" },
];

export const IMAGE_ACCELERATORS = [
  { value: "undeclared", label: "未声明" },
  { value: "none", label: "无加速器" },
  { value: "nvidia", label: "NVIDIA" },
  { value: "amd", label: "AMD" },
  { value: "ascend", label: "昇腾" },
  { value: "other", label: "其他" },
];

export const IMAGE_SPACE_STATES: Record<string, string> = {
  provisioning: "准备中",
  available: "可用",
  blocked: "受阻",
};
export const IMAGE_CREDENTIAL_STATES: Record<string, string> = {
  not_issued: "未签发",
  issuing: "签发中",
  active: "有效",
  disabled: "已停用",
  blocked: "受阻",
};
