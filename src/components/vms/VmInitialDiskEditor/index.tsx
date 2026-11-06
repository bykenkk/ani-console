import { Button, Form, Input, InputNumber, Typography } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { v4 as uuidv4 } from "uuid";
import type { VmInitialDisk } from "@/api/vms";

const DISK_ROW_CLASS_NAME = "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_32px] items-start gap-3";

export default function VmInitialDiskEditor() {
  const { form, disabled } = Form.useFormContext();
  return (
    <Form.List<VmInitialDisk> field="data_disks">
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.length > 0 && (
            <div className={DISK_ROW_CLASS_NAME} aria-hidden="true">
              <Typography.Text type="secondary">名称</Typography.Text>
              <Typography.Text type="secondary">容量</Typography.Text>
              <span />
            </div>
          )}
          {fields.map((item, index) => (
            <div key={item.key} className={DISK_ROW_CLASS_NAME}>
              <Form.Item field={`${item.field}.client_disk_key`} hidden>
                <Input />
              </Form.Item>
              <Form.Item
                field={`${item.field}.name`}
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: "请输入数据盘名称" },
                  {
                    validator: (name, cb) =>
                      cb(name && !name.trim() ? "请输入数据盘名称" : undefined),
                  },
                  { maxLength: 128, message: "数据盘名称不能超过 128 个字符" },
                ]}
              >
                <Input
                  aria-label={`数据盘 ${index + 1} 名称`}
                  placeholder="请输入数据盘名称"
                  maxLength={128}
                />
              </Form.Item>
              <Form.Item
                field={`${item.field}.size_gb`}
                style={{ marginBottom: 0 }}
                formatter={(size: string | undefined) => (size ? Number(size) : undefined)}
                getValueFromEvent={(size: number | undefined) => String(size ?? "")}
                rules={[
                  { required: true, message: "请输入数据盘容量" },
                  {
                    validator: (size, cb) =>
                      cb(
                        size &&
                          (!Number.isInteger(Number(size)) ||
                            Number(size) < 1 ||
                            Number(size) > 9223372036)
                          ? "容量须为 1–9223372036 之间的整数"
                          : undefined,
                      ),
                  },
                ]}
              >
                <InputNumber
                  aria-label={`数据盘 ${index + 1} 容量`}
                  style={{ width: "100%" }}
                  placeholder="请输入数据盘容量"
                  min={1}
                  max={9223372036}
                  precision={0}
                  suffix="GB"
                />
              </Form.Item>
              <Button
                icon={<IconDelete />}
                aria-label={`移除数据盘 ${index + 1}`}
                title={`移除数据盘 ${index + 1}`}
                disabled={disabled}
                onClick={() => remove(index)}
              />
            </div>
          ))}
          <div className="flex justify-end">
            <Button
              type="dashed"
              icon={<IconPlus />}
              aria-label="添加数据盘"
              disabled={disabled}
              onClick={() => {
                const disks: VmInitialDisk[] = form.getFieldValue("data_disks") ?? [];
                let suffix = 1;
                while (disks.some((disk) => disk.name.trim() === `data-${suffix}`)) suffix += 1;
                add({ client_disk_key: uuidv4(), name: `data-${suffix}`, size_gb: "10" });
              }}
            >
              添加
            </Button>
          </div>
        </div>
      )}
    </Form.List>
  );
}
