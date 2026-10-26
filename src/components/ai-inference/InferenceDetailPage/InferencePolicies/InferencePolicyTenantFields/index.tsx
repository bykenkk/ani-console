import { Button, Input, InputNumber } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";

export interface InferencePolicyTenant {
  tenant_id: string;
  requests_per_minute?: number;
  requests_per_hour?: number;
}
type InferencePolicyTenantFieldsProps = {
  value?: InferencePolicyTenant[];
  onChange?: (value: InferencePolicyTenant[]) => void;
  disabled?: boolean;
};

export default function InferencePolicyTenantFields({
  value = [],
  onChange,
  disabled,
}: InferencePolicyTenantFieldsProps) {
  const update = (index: number, changes: Partial<InferencePolicyTenant>) =>
    onChange?.(value.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 text-(--color-text-2)">
          <span>租户 UUID</span>
          <span>每分钟请求上限</span>
          <span>每小时请求上限</span>
          <span className="w-8" />
        </div>
      )}
      {value.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3"
        >
          <Input
            aria-label={`租户 UUID ${index + 1}`}
            placeholder="租户 UUID"
            value={item.tenant_id}
            disabled={disabled}
            onChange={(tenant_id) => update(index, { tenant_id })}
          />
          <InputNumber
            aria-label={`每分钟请求上限 ${index + 1}`}
            placeholder="每分钟上限"
            min={0}
            max={2147483647}
            precision={0}
            value={item.requests_per_minute}
            disabled={disabled}
            onChange={(requests_per_minute) => update(index, { requests_per_minute })}
          />
          <InputNumber
            aria-label={`每小时请求上限 ${index + 1}`}
            placeholder="每小时上限"
            min={0}
            max={2147483647}
            precision={0}
            value={item.requests_per_hour}
            disabled={disabled}
            onChange={(requests_per_hour) => update(index, { requests_per_hour })}
          />
          <Button
            icon={<IconDelete />}
            aria-label={`删除租户 ${index + 1}`}
            title="删除租户"
            disabled={disabled}
            onClick={() => onChange?.(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        icon={<IconPlus />}
        type="outline"
        disabled={disabled}
        onClick={() =>
          onChange?.([...value, { tenant_id: "", requests_per_minute: 0, requests_per_hour: 0 }])
        }
      >
        添加租户
      </Button>
    </div>
  );
}
