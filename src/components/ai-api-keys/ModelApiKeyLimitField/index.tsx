import { Form, InputNumber, Switch } from "@arco-design/web-react";

export interface ModelApiKeyLimit {
  enabled: boolean;
  limit?: number;
}

type ModelApiKeyLimitFieldProps = {
  field: string;
  label: string;
  disabled?: boolean;
};

type ModelApiKeyLimitInputProps = {
  value?: ModelApiKeyLimit;
  onChange?: (value: ModelApiKeyLimit) => void;
  onLimitChange?: () => void;
  onToggle?: () => void;
  label: string;
  disabled?: boolean;
};

function ModelApiKeyLimitInput({
  value = { enabled: false },
  onChange,
  onLimitChange,
  onToggle,
  label,
  disabled,
}: ModelApiKeyLimitInputProps) {
  return (
    <InputNumber
      aria-label={label}
      className="w-full"
      min={1}
      max={2147483647}
      precision={0}
      disabled={disabled}
      readOnly={!value.enabled}
      hideControl={!value.enabled}
      value={value.enabled ? value.limit : undefined}
      placeholder={value.enabled ? "请输入上限" : "不限"}
      suffix={value.enabled ? "次" : undefined}
      onChange={(limit) => {
        if (value.enabled) {
          onChange?.({ ...value, limit });
          onLimitChange?.();
        }
      }}
      prefix={
        <Switch
          aria-label={`${label}限制`}
          checked={value.enabled}
          checkedText="限制"
          uncheckedText="不限"
          disabled={disabled}
          onChange={(enabled) => {
            onChange?.({ ...value, enabled });
            onToggle?.();
          }}
        />
      }
    />
  );
}

export default function ModelApiKeyLimitField({
  field,
  label,
  disabled,
}: ModelApiKeyLimitFieldProps) {
  const { form } = Form.useFormContext();

  return (
    <Form.Item
      field={field}
      label={label}
      validateTrigger="onLimitChange"
      rules={[
        {
          validator: (value: ModelApiKeyLimit | undefined, callback) =>
            callback(
              value?.enabled &&
                (typeof value.limit !== "number" ||
                  !Number.isInteger(value.limit) ||
                  value.limit < 1 ||
                  value.limit > 2147483647)
                ? "请输入 1–2147483647 的整数"
                : undefined,
            ),
        },
      ]}
    >
      <ModelApiKeyLimitInput
        label={label}
        disabled={disabled}
        onToggle={() => form.setFields({ [field]: { error: undefined } })}
      />
    </Form.Item>
  );
}
