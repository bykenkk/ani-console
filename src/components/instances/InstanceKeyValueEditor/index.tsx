import { Button, Input } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import type { InstanceEnvVar } from "@/api/instances";

type InstanceKeyValueEditorProps = {
  value?: InstanceEnvVar[];
  onChange?: (value: InstanceEnvVar[]) => void;
  maxItems: number;
  nameLabel: string;
};

export default function InstanceKeyValueEditor({
  value = [],
  onChange,
  maxItems,
  nameLabel,
}: InstanceKeyValueEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      {value.map((item, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-3">
          <Input
            aria-label={`${nameLabel} ${index + 1}`}
            placeholder={nameLabel}
            value={item.name}
            onChange={(name) =>
              onChange?.(value.map((row, i) => (i === index ? { ...row, name } : row)))
            }
          />
          <Input
            aria-label={`值 ${index + 1}`}
            placeholder="值"
            value={item.value}
            onChange={(nextValue) =>
              onChange?.(value.map((row, i) => (i === index ? { ...row, value: nextValue } : row)))
            }
          />
          <Button
            icon={<IconDelete />}
            aria-label={`删除第 ${index + 1} 项`}
            title="删除"
            onClick={() => onChange?.(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        type="outline"
        icon={<IconPlus />}
        disabled={value.length >= maxItems}
        onClick={() => onChange?.([...value, { name: "", value: "" }])}
      >
        添加
      </Button>
    </div>
  );
}
