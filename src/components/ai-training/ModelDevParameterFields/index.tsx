import { Empty, Form, Input, Select } from "@arco-design/web-react";
import type { ModelDevImplementation } from "@/api/modeldev";
import { getModelDevParameterError, getModelDevParameterLabel } from "@/lib/modeldev";

type ModelDevParameterFieldsProps = { implementation?: ModelDevImplementation };

export default function ModelDevParameterFields({ implementation }: ModelDevParameterFieldsProps) {
  if (!implementation) return <Empty description="请先选择训练方法" />;
  const rules = implementation.parameter_rules ?? [];
  if (!rules.length) return <Empty description="没有可配置参数" />;
  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {rules.map((rule, index) => {
        const placeholder = rule.default_value
          ? `留空使用默认值 ${rule.default_value.value}`
          : rule.required
            ? "请输入参数值"
            : "选填";
        return (
          <Form.Item
            key={rule.name}
            field={`parameters[${index}]`}
            label={getModelDevParameterLabel(rule.name)}
            required={rule.required}
            rules={[
              { validator: (value, callback) => callback(getModelDevParameterError(rule, value)) },
            ]}
          >
            {rule.allowed_values?.length ? (
              <Select
                allowClear
                filterOption={false}
                placeholder={placeholder}
                options={rule.allowed_values.map((item) => ({
                  value: item.value,
                  label: item.value,
                }))}
              />
            ) : (
              <Input allowClear placeholder={placeholder} />
            )}
          </Form.Item>
        );
      })}
    </div>
  );
}
