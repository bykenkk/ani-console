import { Button, Input, InputNumber } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { v4 as uuidv4 } from "uuid";
import type { VmInitialDisk } from "@/api/vms";

type VmInitialDiskEditorProps = {
  value?: VmInitialDisk[];
  onChange?: (value: VmInitialDisk[]) => void;
  disabled?: boolean;
};
export default function VmInitialDiskEditor({
  value = [],
  onChange,
  disabled,
}: VmInitialDiskEditorProps) {
  const update = (key: string, fields: Partial<VmInitialDisk>) =>
    onChange?.(value.map((disk) => (disk.client_disk_key === key ? { ...disk, ...fields } : disk)));
  return (
    <div className="flex flex-col gap-3">
      {value.map((disk, index) => (
        <div
          key={disk.client_disk_key}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3"
        >
          <Input
            aria-label={`数据盘 ${index + 1} 名称`}
            placeholder="数据盘名称"
            maxLength={128}
            value={disk.name}
            disabled={disabled}
            onChange={(name) => update(disk.client_disk_key, { name })}
          />
          <InputNumber
            aria-label={`数据盘 ${index + 1} 容量 (GB)`}
            style={{ width: "100%" }}
            min={1}
            max={9223372036}
            precision={0}
            value={Number(disk.size_gb)}
            suffix="GB"
            disabled={disabled}
            onChange={(size) => update(disk.client_disk_key, { size_gb: String(size ?? "") })}
          />
          <Button
            icon={<IconDelete />}
            aria-label={`移除数据盘 ${index + 1}`}
            title="移除数据盘"
            disabled={disabled}
            onClick={() =>
              onChange?.(value.filter((item) => item.client_disk_key !== disk.client_disk_key))
            }
          />
        </div>
      ))}
      <Button
        type="outline"
        icon={<IconPlus />}
        disabled={disabled}
        onClick={() =>
          onChange?.([
            ...value,
            { client_disk_key: uuidv4(), name: `data-${value.length + 1}`, size_gb: "10" },
          ])
        }
      >
        添加数据盘
      </Button>
    </div>
  );
}
