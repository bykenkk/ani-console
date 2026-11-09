import { Button, Typography, Upload } from "@arco-design/web-react";
import { IconUpload } from "@arco-design/web-react/icon";
import { formatBytes } from "@/lib/format";

interface VmImageFileSelectProps {
  value?: File;
  onChange?: (file: File | undefined) => void;
  disabled?: boolean;
}

export default function VmImageFileSelect({ value, onChange, disabled }: VmImageFileSelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Upload
        showUploadList={false}
        disabled={disabled}
        beforeUpload={(file) => {
          onChange?.(file);
          return false;
        }}
      >
        <Button icon={<IconUpload />} disabled={disabled}>
          选择文件
        </Button>
      </Upload>
      {value ? (
        <div className="flex min-w-0 items-start gap-2">
          <Typography.Text className="min-w-0 break-all">
            {value.name}（{formatBytes(value.size)}）
          </Typography.Text>
          <Button type="text" size="mini" disabled={disabled} onClick={() => onChange?.(undefined)}>
            移除
          </Button>
        </div>
      ) : null}
    </div>
  );
}
