import { Alert, Form, InputNumber, Modal, Typography } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  expandVolume,
  STORAGE_VOLUME_MAX_CAPACITY_GB,
  type StorageVolume,
} from "@/api/storage/volumes";
import { validateForm } from "@/lib/form";
type ExpandStorageVolumeModalProps = { volume: StorageVolume; onCancel: () => void };
type ExpandStorageVolumeFormValues = { capacityGb: number };
export default function ExpandStorageVolumeModal({
  volume,
  onCancel,
}: ExpandStorageVolumeModalProps) {
  const [form] = Form.useForm<ExpandStorageVolumeFormValues>();
  const queryClient = useQueryClient();
  const currentCapacity = Number(volume.requested_capacity_gb);
  const expand = useMutation({
    meta: { feedback: { channel: "message", action: "扩容块存储卷", successText: "扩容已提交" } },
    mutationFn: ({ capacityGb }: ExpandStorageVolumeFormValues) =>
      expandVolume(volume.pvc_name, { expected_uid: volume.uid, capacity_gb: String(capacityGb) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["storage", "volumes"] }),
        queryClient.invalidateQueries({ queryKey: ["storage", "volume", volume.pvc_name] }),
      ]);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="扩容块存储卷"
      onCancel={onCancel}
      confirmLoading={expand.isPending}
      onOk={async () => expand.mutateAsync(await validateForm(form))}
    >
      <Alert
        type="info"
        showIcon
        content={`当前申请容量 ${volume.requested_capacity_gb} GB；块存储只支持扩容，不支持缩容。`}
      />
      <Form
        form={form}
        layout="vertical"
        className="mt-2"
        initialValues={{ capacityGb: currentCapacity + 1 }}
      >
        <Form.Item
          label="新容量 (GB)"
          field="capacityGb"
          required
          rules={[
            {
              validator: (value, callback) =>
                callback(
                  Number.isSafeInteger(value) &&
                    value > currentCapacity &&
                    value <= STORAGE_VOLUME_MAX_CAPACITY_GB
                    ? undefined
                    : `新容量须为大于当前申请容量且不超过 ${STORAGE_VOLUME_MAX_CAPACITY_GB} 的整数`,
                ),
            },
          ]}
        >
          <InputNumber
            min={currentCapacity + 1}
            max={STORAGE_VOLUME_MAX_CAPACITY_GB}
            precision={0}
            className="w-full"
          />
        </Form.Item>
        <Typography.Text type="secondary">
          扩容后请按操作系统要求扩展分区和文件系统。
        </Typography.Text>
      </Form>
    </Modal>
  );
}
