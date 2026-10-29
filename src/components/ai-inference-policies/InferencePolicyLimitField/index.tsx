import { Form, InputNumber, Switch } from "@arco-design/web-react";

export interface InferencePolicyLimit {
  enabled: boolean;
  limit?: number;
}

type InferencePolicyLimitFieldProps = {
  field: string;
  label: string;
  disabled?: boolean;
};

type InferencePolicyLimitInputProps = {
  value?: InferencePolicyLimit;
  onChange?: (value: InferencePolicyLimit) => void;
  onLimitChange?: () => void;
  onToggle?: () => void;
  label: string;
  disabled?: boolean;
};

function InferencePolicyLimitInput({
  value = { enabled: false },
  onChange,
  onLimitChange,
  onToggle,
  label,
  disabled,
}: InferencePolicyLimitInputProps) {
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

export default function InferencePolicyLimitField({
  field,
  label,
  disabled,
}: InferencePolicyLimitFieldProps) {
  const { form } = Form.useFormContext();

  return (
    <Form.Item
      field={field}
      label={label}
      validateTrigger="onLimitChange"
      rules={[
        {
          validator: (value: InferencePolicyLimit | undefined, callback) =>
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
      <InferencePolicyLimitInput
        label={label}
        disabled={disabled}
        onToggle={() => form.setFields({ [field]: { error: undefined } })}
      />
    </Form.Item>
  );
}
