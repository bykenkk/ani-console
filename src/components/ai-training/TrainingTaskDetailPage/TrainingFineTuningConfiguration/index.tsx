import { Card, Descriptions, Empty } from "@arco-design/web-react";
import type { ModelDevExecutionDetail } from "@/api/modeldev";
import { ResourceId } from "@/components/common";

type TrainingFineTuningConfigurationProps = {
  baseModel: ModelDevExecutionDetail["base_model"];
  managedSettings: ModelDevExecutionDetail["managed_settings"];
};

const SETTING_LABELS: Record<
  keyof NonNullable<ModelDevExecutionDetail["managed_settings"]>,
  string
> = {
  stage: "训练阶段",
  finetuning_type: "微调方法",
  lora_target: "LoRA 目标模块",
  lora_rank: "LoRA Rank",
  lora_alpha: "LoRA Alpha",
  cutoff_len: "截断长度",
  per_device_train_batch_size: "单设备批量大小",
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
  num_train_epochs: "训练轮数",
  optim: "优化器",
  logging_steps: "日志记录间隔",
};

export default function TrainingFineTuningConfiguration({
  baseModel,
  managedSettings,
}: TrainingFineTuningConfigurationProps) {
  return (
    <>
      <Card title="基座模型" bordered={false}>
        {baseModel ? (
          <Descriptions
            column={1}
            data={[
              { label: "模型 ID", value: <ResourceId value={baseModel.model_id} /> },
              { label: "版本 ID", value: <ResourceId value={baseModel.version_id} /> },
              { label: "模型族", value: baseModel.family || "-" },
              { label: "权重格式", value: baseModel.format || "-" },
            ]}
          />
        ) : (
          <Empty description="暂无基座模型信息" />
        )}
      </Card>
      <Card title="托管训练配置（只读）" bordered={false}>
        {managedSettings ? (
          <Descriptions
            column={2}
            data={Object.entries(managedSettings).map(([name, value]) => ({
              label: SETTING_LABELS[name as keyof typeof SETTING_LABELS] ?? name,
              value: (
                <span className="break-all">
                  {typeof value === "boolean" ? (value ? "是" : "否") : value || "-"}
                </span>
              ),
            }))}
          />
        ) : (
          <Empty description="暂无托管训练配置" />
        )}
      </Card>
    </>
  );
}
