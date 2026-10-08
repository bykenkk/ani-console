import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances";
import { validateForm } from "@/lib/form";
import { Form, Modal, Select } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";

type ModalProps = {
  instance: InstanceRecord;
  onCancel: () => void;
  onSubmitted: (operationId: string) => void;
};

function attachedVolumeId(volume: NonNullable<InstanceRecord["volumes"]>[number]) {
  const sourceRef = volume.source_ref?.trim();
  if (!sourceRef) return "";
  return sourceRef.startsWith("volume/") ? sourceRef.slice("volume/".length) : sourceRef;
}

export default function InstanceDetachVolumeModal({ instance, onCancel, onSubmitted }: ModalProps) {
  const [form] = Form.useForm<{ volumeId: string }>();
  const mutation = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "卸载云盘",
        successText: "卸载云盘已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async ({ volumeId }: { volumeId: string }) => {
      const data = await applyInstanceLifecycle(instance.id, {
        action: "detach_volume",
        volume_id: volumeId,
      });
      return data.operation_id;
    },
    onSuccess: onSubmitted,
  });
  const options = (instance.volumes ?? []).filter(
    (volume) => volume.kind !== "root_disk" && Boolean(attachedVolumeId(volume)),
  );

  return (
    <Modal
      title={`卸载云盘 · ${instance.name}`}
      visible
      confirmLoading={mutation.isPending}
      onCancel={onCancel}
      onOk={async () => mutation.mutate(await validateForm(form))}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item
          field="volumeId"
          label="云盘"
          rules={[{ required: true, message: "请选择云盘" }]}
        >
          <Select placeholder="请选择要卸载的云盘">
            {options.map((volume) => (
              <Select.Option key={attachedVolumeId(volume)} value={attachedVolumeId(volume)}>
                {volume.name} · {attachedVolumeId(volume)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
