import { Button, Form, Input, Typography } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import type { InstanceEnvVar } from "@/api/instances";
import { validateConfigSize } from "../ContainerResourceFields/utils";

type InstanceKeyValueEditorProps = {
  field: "env" | "labels" | "annotations";
  maxItems: number;
  nameLabel: string;
};
const ROW_CLASS_NAME = "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_32px] items-start gap-3";

export default function InstanceKeyValueEditor({
  field,
  maxItems,
  nameLabel,
}: InstanceKeyValueEditorProps) {
  const { form, disabled } = Form.useFormContext();
  const addLabel = { env: "添加环境变量", labels: "添加标签", annotations: "添加注解" }[field];
  return (
    <Form.List<InstanceEnvVar>
      field={field}
      noStyle={{ showErrorTip: true }}
      rules={[
        { type: "array", maxLength: maxItems, message: `最多添加 ${maxItems} 项` },
        {
          validator: (rows, cb) =>
            cb(
              validateConfigSize(
                field === "env"
                  ? (rows ?? []).map((row) => ({ name: "", value: row.value }))
                  : [
                      ...(rows ?? []),
                      ...(form.getFieldValue(field === "labels" ? "annotations" : "labels") ?? []),
                    ],
              ),
            ),
        },
      ]}
    >
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.length > 0 && (
            <div className={ROW_CLASS_NAME} aria-hidden="true">
              <Typography.Text type="secondary">{nameLabel}</Typography.Text>
              <Typography.Text type="secondary">值</Typography.Text>
              <span />
            </div>
          )}
          {fields.map((item, index) => (
            <div key={item.key} className={ROW_CLASS_NAME}>
              <Form.Item
                field={`${item.field}.name`}
                style={{ marginBottom: 0 }}
                dependencies={[field]}
                rules={[
                  { required: true, message: `请输入${nameLabel}` },
                  {
                    validator: (name: string | undefined, cb) => {
                      const rows: InstanceEnvVar[] = form.getFieldValue(field) ?? [];
                      cb(
                        name && name.trim() !== name
                          ? `${nameLabel}不能包含首尾空格`
                          : name && rows.filter((row) => row.name === name).length > 1
                            ? `${nameLabel}不能重复`
                            : undefined,
                      );
                    },
                  },
                ]}
              >
                <Input
                  aria-label={`${nameLabel} ${index + 1}`}
                  placeholder={`请输入${nameLabel}`}
                />
              </Form.Item>
              <Form.Item field={`${item.field}.value`} style={{ marginBottom: 0 }}>
                <Input
                  aria-label={`${nameLabel} ${index + 1} 的值`}
                  placeholder="请输入值，可留空"
                />
              </Form.Item>
              <Button
                icon={<IconDelete />}
                aria-label={`移除${nameLabel} ${index + 1}`}
                title={`移除${nameLabel} ${index + 1}`}
                disabled={disabled}
                onClick={() => remove(index)}
              />
            </div>
          ))}
          <div className="flex justify-start">
            <Button
              type="text"
              style={{ padding: 0 }}
              icon={<IconPlus />}
              aria-label={addLabel}
              disabled={disabled || fields.length >= maxItems}
              onClick={() => {
                if (fields.length < maxItems) add({ name: "", value: "" });
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
