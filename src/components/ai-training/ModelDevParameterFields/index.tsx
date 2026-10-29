import { Empty, Form, Input, Select } from "@arco-design/web-react";
import type { ModelDevImplementation } from "@/api/modeldev";
import { getModelDevParameterError, getModelDevParameterLabel } from "@/lib/modeldev";

type ModelDevParameterFieldsProps = {
  implementation?: ModelDevImplementation;
  contextLimit?: string;
};

export default function ModelDevParameterFields({
  implementation,
  contextLimit,
}: ModelDevParameterFieldsProps) {
  const { disabled } = Form.useFormContext();
  if (!implementation) return <Empty description="请先选择训练方法或微调技术" />;
  const rules = implementation.parameter_rules ?? [];
  if (!rules.length) return <Empty description="没有可配置参数" />;
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {rules.map((rule, index) => {
        const editable = rule.editable !== false;
        const placeholder = !editable
          ? rule.default_value
            ? `默认值 ${rule.default_value.value}`
            : "由系统管理"
          : rule.default_value
            ? `留空使用默认值 ${rule.default_value.value}`
            : rule.required
              ? "请输入参数值"
              : "选填";
        return (
          <Form.Item
            key={rule.name}
            field={`parameters[${index}]`}
            label={getModelDevParameterLabel(rule.name)}
            required={editable && rule.required}
            extra={
              !editable
                ? rule.non_editable_reason || "此参数由系统管理"
                : rule.name === "cutoff_len" && contextLimit
                  ? `当前模型最大序列长度：${contextLimit}`
                  : undefined
            }
            rules={[
              {
                validator: (value, callback) => {
                  let error = getModelDevParameterError(rule, value);
                  if (
                    !error &&
                    rule.name === "cutoff_len" &&
                    contextLimit &&
                    BigInt(value || rule.default_value?.value || "0") > BigInt(contextLimit)
                  ) {
                    error = `不能超过当前模型的最大序列长度 ${contextLimit}`;
                  }
                  callback(error);
                },
              },
            ]}
          >
            {rule.allowed_values?.length ? (
              <Select
                allowClear
                disabled={disabled || !editable}
                filterOption={false}
                placeholder={placeholder}
                options={rule.allowed_values.map((item) => ({
                  value: item.value,
                  label: item.value,
                }))}
              />
            ) : (
              <Input allowClear disabled={disabled || !editable} placeholder={placeholder} />
            )}
          </Form.Item>
        );
      })}
    </div>
  );
}
