import { Card, Form, Select, Typography } from "@arco-design/web-react";
import type { FineTuningReadiness } from "@/api/modeldev";
import { getFineTuningReadinessError } from "@/lib/modeldev";

type FineTuningReadinessFieldsProps = {
  readiness?: FineTuningReadiness;
  checking: boolean;
  enabled: boolean;
};

export default function FineTuningReadinessFields({
  readiness,
  checking,
  enabled,
}: FineTuningReadinessFieldsProps) {
  const { disabled } = Form.useFormContext();
  const message = getFineTuningReadinessError(readiness, checking);
  return (
    <Card bordered={false} title="模型适用性">
      <Typography.Paragraph>
        {!enabled
          ? "请选择已就绪的模型版本、算力规格和微调技术"
          : checking
            ? "正在检查模型适用性"
            : readiness
              ? message || "模型适用性检查通过；实际执行时仍会复核运行条件"
              : "尚未完成模型适用性检查"}
      </Typography.Paragraph>
      {readiness?.model_type && (
        <Typography.Paragraph>
          模型类型：{readiness.model_type}；最大序列长度：{readiness.context_limit}
        </Typography.Paragraph>
      )}
      <Form.Item
        field="finetuning_template"
        label="微调模板"
        formatter={(value) => value || undefined}
        required={readiness?.assessment === "TEMPLATE_REQUIRED"}
        extra="留空时由后端选择模型默认模板；需要指定时，从当前运行时支持的模板中选择。"
        rules={[
          {
            validator: (_, callback) => callback(getFineTuningReadinessError(readiness, checking)),
          },
        ]}
      >
        <Select
          allowClear
          disabled={disabled || !enabled || checking}
          loading={checking}
          filterOption={false}
          placeholder="自动使用模型默认模板"
          options={(readiness?.template_candidates ?? []).map((template) => ({
            label: template.id,
            value: template.id,
          }))}
        />
      </Form.Item>
    </Card>
  );
}
