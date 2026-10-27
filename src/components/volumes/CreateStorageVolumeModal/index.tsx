import { Form, Input, InputNumber, Modal, Select, Switch } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVolume, type StorageVolumeMode } from "@/api/storage/volumes";
import { validateForm } from "@/lib/form";
import StorageVolumeClassField from "@/components/volumes/StorageVolumeClassField";

type CreateStorageVolumeModalProps = { onCancel: () => void };
type CreateStorageVolumeFormValues = {
  name: string;
  sizeGb: number;
  storageClassName: string;
  volumeMode: StorageVolumeMode;
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
        initialValues={{ name: "", sizeGb: 40, volumeMode: "Filesystem" }}
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
                  Number.isSafeInteger(value) && value > 0
                    ? undefined
                    : "容量必须是大于 0 的整数（GB）",
                ),
            },
          ]}
        >
          <InputNumber min={1} max={Number.MAX_SAFE_INTEGER} precision={0} className="w-full" />
        </Form.Item>
        <StorageVolumeClassField />
        {/* TODO(storage-migration): 加密和创建时挂载暂无新契约，旧提交逻辑保留在 CreateVolumeModal，不能混用实例 ID。 */}
        <Form.Item label="是否加密" extra="暂未支持">
          <Switch disabled />
        </Form.Item>
        <Form.Item label="用途" field="volumeMode" required extra="用途创建后不可修改。">
          <Select
            options={[
              { value: "Filesystem", label: "文件系统" },
              { value: "Block", label: "块设备" },
            ]}
          />
        </Form.Item>
        <Form.Item label="挂载实例">
          <Select disabled placeholder="暂未支持创建时挂载" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
