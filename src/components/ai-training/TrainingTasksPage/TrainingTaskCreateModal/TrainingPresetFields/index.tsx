// FIXME(modeldev-integration): CPU-P01 的固定参数和 learning_rate 开区间依赖名称特判，parameter_rules 无法完整表达只读及边界语义。
// TODO(modeldev-integration): 后端补齐或明确参数规则表达后移除特判；扩展训练类型前同步核对校验和提交逻辑。
import { Card, Form, Input, Typography } from "@arco-design/web-react";
import type { ModelDevPreset, ModelDevParameterRule } from "@/api/modeldev";

type TrainingPresetFieldsProps = { preset?: ModelDevPreset };

function parameterError(rule: ModelDevParameterRule, value?: string) {
  if (!value?.trim()) return rule.required ? "请填写此参数" : undefined;
  if (rule.allowed_values?.length && !rule.allowed_values.some((item) => item.value === value))
    return "请输入允许的参数值";
  if (rule.type === "INTEGER" || rule.type === "DECIMAL") {
    const pattern = rule.type === "INTEGER" ? /^-?\d+$/ : /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
    if (!pattern.test(value) || !Number.isFinite(Number(value))) return "请输入有效数字";
    if (rule.minimum && Number(value) < Number(rule.minimum.value))
      return `不能小于 ${rule.minimum.value}`;
    if (rule.maximum && Number(value) > Number(rule.maximum.value))
      return `不能大于 ${rule.maximum.value}`;
    // CPU-P01 的学习率下界为开区间，当前 parameter_rules 未携带开闭区间标记。
    if (rule.name === "learning_rate" && Number(value) <= 0) return "学习率必须大于 0";
  }
  return undefined;
}

export default function TrainingPresetFields({ preset }: TrainingPresetFieldsProps) {
  return (
    <Card bordered={false}>
      {(preset?.parameter_rules ?? []).map((rule, index) => (
        <Form.Item
          key={rule.name}
          field={`parameters[${index}]`}
          label={rule.name}
          required={rule.required}
          rules={[
            {
              validator: (value, callback) => {
                const error = parameterError(rule, value);
                if (error) callback(error);
                else callback();
              },
            },
          ]}
        >
          <Input
            disabled={
              rule.allowed_values?.length === 1 ||
              (preset?.kind === "GENERAL_TRAINING" &&
                (rule.name === "batch_size" || rule.name === "epochs"))
            }
            placeholder={rule.required ? "请输入参数值" : "可不填写"}
          />
        </Form.Item>
      ))}
      {!preset?.parameter_rules?.length && (
        <Typography.Paragraph type="secondary">该预设没有可配置参数</Typography.Paragraph>
      )}
    </Card>
  );
}
