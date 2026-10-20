import { Form, Input, Select, Switch } from "@arco-design/web-react";
import ContainerFilesystemMountFields from "@/components/instances/ContainerFilesystemMountFields";
import { type ContainerFilesystemItem } from "@/components/instances/ContainerFilesystemMountFields";
import { hasDuplicateContainerMountPath } from "./storage";

export type ContainerStorageFormValues = {
  volume_id: string;
  volume_mount_path: string;
  volume_read_only: boolean;
  filesystem_id: string;
  filesystem_mount_path: string;
  filesystem_read_only: boolean;
};

type ContainerStorageFieldsProps = {
  values: ContainerStorageFormValues;
  volumes?: StorageItem[];
  filesystems?: ContainerFilesystemItem[];
};

type StorageItem = {
  id: string;
  name?: string | null;
};

export default function ContainerStorageFields({
  values,
  volumes,
  filesystems,
}: ContainerStorageFieldsProps) {
  const hasDuplicateMountPath = hasDuplicateContainerMountPath(values);

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-4">
        <Form.Item
          field="volume_id"
          label="块存储卷"
          extra="仅可选择容器目录卷；VM 数据盘不能用于容器目录挂载。"
          rules={[
            {
              validator: (value, callback) => {
                if (value && !volumes?.some((item) => item.id === value)) {
                  callback("请选择用途为容器目录的卷");
                } else {
                  callback();
                }
              },
            },
          ]}
        >
          <Select allowClear placeholder="不挂载块存储">
            {volumes?.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {item.name ?? item.id}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          field="volume_mount_path"
          label="挂载路径"
          rules={
            values.volume_id ? [{ required: true, message: "请输入块存储挂载路径" }] : undefined
          }
        >
          <Input disabled={!values.volume_id} placeholder="/data" />
        </Form.Item>
        <Form.Item field="volume_read_only" label="只读挂载" triggerPropName="checked">
          <Switch disabled={!values.volume_id} />
        </Form.Item>
      </div>

      <ContainerFilesystemMountFields
        values={values}
        filesystems={filesystems}
        mountPathError={
          hasDuplicateMountPath ? "块存储卷与文件存储不能使用相同的容器挂载路径" : undefined
        }
      />
    </>
  );
}
