import { Form, Select } from "@arco-design/web-react";

type VpcCidrFieldProps = {
  value: string;
  onChange: (value: string) => void;
  cidrs: string[];
  loading: boolean;
  disabled: boolean;
  submitted: boolean;
  onOpen: () => void;
};

export default function VpcCidrField({
  value,
  onChange,
  cidrs,
  loading,
  disabled,
  submitted,
  onOpen,
}: VpcCidrFieldProps) {
  const error = submitted && !cidrs.includes(value) ? "请选择当前可用的 IPv4 CIDR" : undefined;
  return (
    <Form.Item label="IPv4 CIDR" required validateStatus={error ? "error" : undefined} help={error}>
      <Select
        value={cidrs.includes(value) ? value : undefined}
        onChange={onChange}
        onVisibleChange={(visible) => {
          if (visible) onOpen();
        }}
        options={cidrs}
        placeholder="请选择 IPv4 CIDR"
        loading={loading}
        disabled={disabled}
        showSearch
      />
    </Form.Item>
  );
}
