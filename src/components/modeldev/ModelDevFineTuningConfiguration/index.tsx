import { Card, Descriptions, Empty } from "@arco-design/web-react";
import type { ModelDevExecutionDetail } from "@/api/modeldev";

type ModelDevFineTuningConfigurationProps = {
  managedSettings: ModelDevExecutionDetail["managed_settings"];
};

const SETTING_LABELS: Record<
  keyof NonNullable<ModelDevExecutionDetail["managed_settings"]>,
  string
> = {
  stage: "训练目标",
  finetuning_type: "参数更新方式",
  lora_target: "LoRA 目标模块",
  lora_rank: "LoRA Rank",
  lora_alpha: "LoRA Alpha",
  cutoff_len: "最大序列长度",
  per_device_train_batch_size: "每设备批次大小",
  gradient_accumulation_steps: "梯度累积步数",
  seed: "随机种子",
  data_seed: "数据随机种子",
  device: "训练设备",
  fp16: "FP16",
  bf16: "BF16",
  flash_attn: "Flash Attention",
  report_to: "指标报告目标",
  save_strategy: "保存策略",
  template: "提示词模板",
  train_dtype: "训练精度",
  export_dtype: "导出精度",
  verify_dtype: "验证精度",
  lr_scheduler_type: "学习率调度",
  warmup_ratio: "预热比例",
  weight_decay: "权重衰减",
  lora_dropout: "LoRA Dropout",
  num_train_epochs: "训练轮次",
  optim: "优化器",
  logging_steps: "日志记录间隔",
};

const TRAINING_KEYS = new Set([
  "stage",
  "finetuning_type",
  "cutoff_len",
  "per_device_train_batch_size",
  "gradient_accumulation_steps",
  "seed",
  "data_seed",
  "lr_scheduler_type",
  "warmup_ratio",
  "weight_decay",
  "num_train_epochs",
  "optim",
]);

const METHOD_LABELS: Record<string, string> = { lora: "LoRA", qlora: "QLoRA", full: "全参数" };

function formatSettingValue(name: string, value: string | boolean): string {
  if (typeof value === "boolean") return value ? "是" : "否";
  if (name === "stage") return value.toUpperCase() || "-";
  if (name === "finetuning_type") return METHOD_LABELS[value] || value || "-";
  return value || "-";
}

export default function ModelDevFineTuningConfiguration({
  managedSettings,
}: ModelDevFineTuningConfigurationProps) {
  if (!managedSettings)
    return (
      <Card title="微调配置" bordered={false}>
        <Empty description="暂无微调配置" />
      </Card>
    );
  const settings = Object.entries(managedSettings);
  const groups = [
    { title: "微调配置", entries: settings.filter(([name]) => TRAINING_KEYS.has(name)) },
    { title: "LoRA 配置", entries: settings.filter(([name]) => name.startsWith("lora_")) },
    {
      title: "运行与保存配置",
      entries: settings.filter(([name]) => !TRAINING_KEYS.has(name) && !name.startsWith("lora_")),
    },
  ];

  return (
    <>
      {groups
        .filter((group) => group.entries.length > 0)
        .map((group) => (
          <Card key={group.title} title={group.title} bordered={false}>
            <Descriptions
              column={2}
              data={group.entries.map(([name, value]) => ({
                label: SETTING_LABELS[name as keyof typeof SETTING_LABELS] ?? name,
                value: <span className="break-all">{formatSettingValue(name, value)}</span>,
              }))}
            />
          </Card>
        ))}
    </>
  );
}
