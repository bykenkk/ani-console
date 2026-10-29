import { Form, Input } from "@arco-design/web-react";
import InferencePolicyLimitField, { type InferencePolicyLimit } from "../InferencePolicyLimitField";
import InferencePolicyModelsField, {
  type InferencePolicyModels,
} from "../InferencePolicyModelsField";

export interface InferencePolicyFormValues {
  name: string;
  scope: InferencePolicyModels;
  requests_per_second: InferencePolicyLimit;
  requests_per_minute: InferencePolicyLimit;
  requests_per_hour: InferencePolicyLimit;
}

type InferencePolicyFormFieldsProps = { disabled?: boolean };

const limitFields = [
  { field: "requests_per_second", label: "每秒请求上限" },
  { field: "requests_per_minute", label: "每分钟请求上限" },
  { field: "requests_per_hour", label: "每小时请求上限" },
] as const;

export default function InferencePolicyFormFields({ disabled }: InferencePolicyFormFieldsProps) {
  return (
    <>
      <Form.Item
        field="name"
        label="名称"
        rules={[
          { required: true, match: /\S/, message: "请输入访问策略名称" },
          {
            validator: (value: string | undefined, callback) =>
              callback(
                value && new Blob([value.trim()]).size > 256 ? "名称不能超过 256 字节" : undefined,
              ),
          },
        ]}
      >
        <Input placeholder="请输入访问策略名称" maxLength={256} />
      </Form.Item>
      <InferencePolicyModelsField disabled={disabled} />
      {limitFields.map(({ field, label }) => (
        <InferencePolicyLimitField key={field} field={field} label={label} disabled={disabled} />
      ))}
    </>
  );
}
