import { Alert, Form, Modal, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listVmMedia, setVmMedia, type VirtualMachine, type VmMediaSlot } from "@/api/vms";
import { useVMMutation } from "@/hooks/useVMMutation";
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
    meta: { errorNotification: { id: "vm-media", action: "ISO 镜像列表加载" } },
  });
  const mutation = useVMMutation<VmSetMediaFormValues>({
    vmId: vm.id,
    action: "加载镜像",
    actionId: "vm-media-set",
    onSubmitted,
    mutationFn: (values) =>
      setVmMedia(vm.id, slot, { expected_version: vm.version, media_key: values.mediaKey }),
  });
  const kind = slot === "INSTALL" ? "INSTALL_ISO" : "DRIVER_ISO";
  return (
    <Modal
      visible
      title={`加载 / 更换${slot === "INSTALL" ? "安装镜像" : "驱动镜像"} · ${vm.name}`}
      onCancel={onCancel}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: vmIsClosed(vm) || mutation.busy || media.isFetching }}
      onOk={async () => {
        if (mutation.busy || vmIsClosed(vm) || media.isFetching) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Alert
        type="info"
        content={`${slot === "INSTALL" ? "选择用于安装操作系统的 ISO 镜像。" : "选择用于安装设备驱动的 ISO 镜像。"}保存后不会自动重启云主机；如提示“下次启动生效”，请在适当时间正常关机再启动。`}
      />
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          field="mediaKey"
          label="ISO 镜像"
          rules={[
            { required: true, message: "请选择 ISO 镜像" },
            {
              validator: (value, callback) => {
                if (
                  !media.data?.items.some((item) => item.mediaKey === value && item.kind === kind)
                )
                  callback("请选择对应用途的可用 ISO 镜像");
              },
            },
          ]}
        >
          <Select
            loading={media.isFetching}
            filterOption={false}
            placeholder="请选择 ISO 镜像"
            options={(media.data?.items ?? []).map((item) => ({
              value: item.mediaKey,
              label: `${item.name} · ${item.kind === "INSTALL_ISO" ? "安装镜像" : item.kind === "DRIVER_ISO" ? "驱动镜像" : "系统镜像"} · ${item.mediaKey}`,
              disabled: item.kind !== kind,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
