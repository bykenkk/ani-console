import { Form, Input, InputNumber, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createVolume,
  STORAGE_VOLUME_MAX_CAPACITY_GB,
  type StorageVolumeAccessMode,
  type StorageVolumeMode,
} from "@/api/storage/volumes";
import { validateForm } from "@/lib/form";
import StorageVolumeClassField from "@/components/volumes/StorageVolumeClassField";

type CreateStorageVolumeModalProps = { onCancel: () => void };
type CreateStorageVolumeFormValues = {
  name: string;
  sizeGb: number;
  storageClassName: string;
  volumeMode: StorageVolumeMode;
  accessMode: StorageVolumeAccessMode;
};
export default function CreateStorageVolumeModal({ onCancel }: CreateStorageVolumeModalProps) {
  const [form] = Form.useForm<CreateStorageVolumeFormValues>();
  const queryClient = useQueryClient();
  const create = useMutation({
    meta: { feedback: { channel: "message", action: "创建块存储卷", successText: "创建已提交" } },
    mutationFn: (values: CreateStorageVolumeFormValues) =>
      createVolume({
        display_name: values.name.trim(),
        capacity_gb: String(values.sizeGb),
        storage_class_name: values.storageClassName,
        volume_mode: values.volumeMode,
        access_modes: [values.accessMode],
      }),
    onSuccess: async () => {
      // TODO(storage-task): 暂缓 task 追踪，创建受理不代表 PVC 已 Bound。
      await queryClient.invalidateQueries({ queryKey: ["storage", "volumes"] });
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建块存储卷"
      onCancel={onCancel}
      confirmLoading={create.isPending}
      onOk={async () => create.mutateAsync(await validateForm(form))}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: "",
          sizeGb: 40,
          volumeMode: "Filesystem",
          accessMode: "ReadWriteOnce",
        }}
      >
        <Form.Item
          label="名称"
          field="name"
          required
          rules={[
            {
              validator: (value, callback) => {
                const name = String(value ?? "").trim();
                callback(
                  !name || Array.from(name).length > 128 || /\p{Cc}/u.test(name)
                    ? "名称须为 1–128 个字符且不能包含控制字符"
                    : undefined,
                );
              },
            },
          ]}
        >
          <Input placeholder="请输入卷名称" maxLength={128} showWordLimit />
        </Form.Item>
        <Form.Item
          label="容量 (GB)"
          field="sizeGb"
          required
          rules={[
            {
              validator: (value, callback) =>
                callback(
                  Number.isSafeInteger(value) &&
                    value > 0 &&
                    value <= STORAGE_VOLUME_MAX_CAPACITY_GB
                    ? undefined
                    : `容量须为 1–${STORAGE_VOLUME_MAX_CAPACITY_GB} 的整数（GB）`,
                ),
            },
          ]}
        >
          <InputNumber
            min={1}
            max={STORAGE_VOLUME_MAX_CAPACITY_GB}
            precision={0}
            className="w-full"
          />
        </Form.Item>
        <StorageVolumeClassField />
        <Form.Item
          label="用途"
          field="volumeMode"
          required
          extra="用途创建后不可修改；当前容器实例仅支持文件系统卷。"
        >
          <Select
            options={[
              { value: "Filesystem", label: "文件系统" },
              { value: "Block", label: "块设备" },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="访问模式"
          field="accessMode"
          rules={[{ required: true, message: "请选择访问模式" }]}
          extra="实际可用模式取决于所选存储类型。"
        >
          <Select
            options={[
              { value: "ReadWriteOnce", label: "单节点读写（ReadWriteOnce）" },
              { value: "ReadOnlyMany", label: "多节点只读（ReadOnlyMany）" },
              { value: "ReadWriteMany", label: "多节点读写（ReadWriteMany）" },
              { value: "ReadWriteOncePod", label: "单 Pod 读写（ReadWriteOncePod）" },
            ]}
          />
        </Form.Item>
        {/* TODO(storage-migration): 创建时挂载暂无新契约，旧提交逻辑保留在 CreateVolumeModal，不能混用实例 ID。 */}
        <Form.Item label="挂载实例">
          <Select disabled placeholder="暂未支持创建时挂载" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
