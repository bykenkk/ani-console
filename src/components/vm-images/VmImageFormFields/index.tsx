import { Checkbox, Form, Input, InputNumber, Select } from "@arco-design/web-react";
import { VM_IMAGE_KINDS } from "../options";

interface VmImageFormFieldsProps {
  disabled: boolean;
}

export default function VmImageFormFields({ disabled }: VmImageFormFieldsProps) {
  return (
    <>
      <Form.Item
        field="name"
        label="镜像名称"
        required
        rules={[
          {
            validator: (value: string | undefined, callback) =>
              callback(
                !value?.trim()
                  ? "请输入镜像名称"
                  : [...value.trim()].length > 80
                    ? "镜像名称最多 80 个字符"
                    : undefined,
              ),
          },
        ]}
      >
        <Input disabled={disabled} placeholder="例如 Ubuntu 24.04" />
      </Form.Item>
      <div className="grid grid-cols-2 gap-x-4">
        <Form.Item
          field="kind"
          label="镜像类型"
          rules={[{ required: true, message: "请选择镜像类型" }]}
        >
          <Select
            disabled={disabled}
            options={Object.entries(VM_IMAGE_KINDS).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        <Form.Item
          field="sourceCapacityGb"
          label="源卷容量"
          required
          tooltip="用于存放镜像的源卷容量，应满足镜像展开后的空间需求。"
          rules={[
            {
              validator: (value: string | undefined, callback) =>
                callback(
                  value && /^[1-9]\d*$/.test(value) && BigInt(value) <= 9223372036854775807n
                    ? undefined
                    : "请输入至少 1 GiB 的整数容量",
                ),
            },
          ]}
        >
          <InputNumber
            strictMode
            min={1}
            precision={0}
            suffix="GiB"
            disabled={disabled}
            placeholder="请输入容量"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </div>
      <div className="grid grid-cols-2 gap-x-4">
        <Form.Item
          field="osFamily"
          label="操作系统"
          rules={[{ required: true, message: "请选择操作系统" }]}
        >
          <Select
            disabled={disabled}
            options={[
              { value: "linux", label: "Linux" },
              { value: "windows", label: "Windows" },
            ]}
          />
        </Form.Item>
        <Form.Item
          field="osVersion"
          label="系统版本"
          required
          rules={[
            {
              validator: (value: string | undefined, callback) =>
                callback(
                  !value?.trim()
                    ? "请输入系统版本"
                    : [...value.trim()].length > 40
                      ? "系统版本最多 40 个字符"
                      : undefined,
                ),
            },
          ]}
        >
          <Input disabled={disabled} placeholder="例如 24.04" />
        </Form.Item>
      </div>
      <Form.Item
        noStyle
        shouldUpdate={(previous, next) =>
          previous.kind !== next.kind || previous.osFamily !== next.osFamily
        }
      >
        {(values) =>
          values.kind === "DISK_IMAGE" && values.osFamily === "linux" ? (
            <Form.Item
              field="supportsCloudInit"
              label="初始化能力"
              triggerPropName="checked"
              extra="请确认镜像已安装并启用 cloud-init；此声明创建后不可修改。"
            >
              <Checkbox disabled={disabled}>镜像支持 cloud-init 初始化</Checkbox>
            </Form.Item>
          ) : null
        }
      </Form.Item>
      <Form.Item
        field="description"
        label="描述"
        rules={[
          {
            validator: (value: string | undefined, callback) =>
              callback([...(value ?? "")].length > 512 ? "描述最多 512 个字符" : undefined),
          },
        ]}
      >
        <Input.TextArea
          disabled={disabled}
          placeholder="选填"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>
    </>
  );
}
