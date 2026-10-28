import { Alert, Form, Modal, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listVmMedia, setVmMedia, type VirtualMachine, type VmMediaSlot } from "@/api/vms";
import { useVmResourceMutation } from "@/hooks/useVmResourceMutation";
import { validateForm } from "@/lib/form";
import { vmIsClosed } from "@/lib/vms";

type VmSetMediaModalProps = {
  vm: VirtualMachine;
  slot: VmMediaSlot;
  onCancel: () => void;
  onSubmitted: () => void;
};
type VmSetMediaFormValues = { mediaKey: string };

export default function VmSetMediaModal({ vm, slot, onCancel, onSubmitted }: VmSetMediaModalProps) {
  const [form] = Form.useForm<VmSetMediaFormValues>();
  const media = useQuery({
    queryKey: ["vm-media"],
    queryFn: ({ signal }) => listVmMedia(signal),
    meta: { errorNotification: { id: "vm-media", action: "虚拟机介质加载" } },
  });
  const mutation = useVmResourceMutation<VmSetMediaFormValues>({
    vmId: vm.id,
    action: "设置介质",
    actionId: "vm-media-set",
    onSubmitted,
    mutationFn: (values) =>
      setVmMedia(vm.id, slot, { expected_version: vm.version, media_key: values.mediaKey }),
  });
  const kind = slot === "INSTALL" ? "INSTALL_ISO" : "DRIVER_ISO";
  return (
    <Modal
      visible
      title={`${slot === "INSTALL" ? "安装" : "驱动"}介质 · ${vm.name}`}
      onCancel={onCancel}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: vmIsClosed(vm) || mutation.busy || media.isFetching }}
      onOk={async () => {
        if (mutation.busy || vmIsClosed(vm) || media.isFetching) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Alert type="info" content="介质变更可能需要重启后生效，请以实际介质及待重启状态为准。" />
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          field="mediaKey"
          label="介质"
          rules={[
            { required: true, message: "请选择介质" },
            {
              validator: (value, callback) => {
                if (
                  !media.data?.items.some((item) => item.mediaKey === value && item.kind === kind)
                )
                  callback("请选择对应类型的可用 ISO 介质");
              },
            },
          ]}
        >
          <Select
            loading={media.isFetching}
            filterOption={false}
            placeholder="请选择介质"
            options={(media.data?.items ?? []).map((item) => ({
              value: item.mediaKey,
              label: `${item.name} · ${item.kind} · ${item.mediaKey}`,
              disabled: item.kind !== kind,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
