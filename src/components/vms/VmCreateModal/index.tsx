import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Checkbox,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
} from "@arco-design/web-react";
import { createVm, listVmMedia, type VmInitialDisk, type VmDns, type VmMedia } from "@/api/vms";
import type { InstancePreset } from "@/api/instances";
import InstanceComputePresetSelect from "@/components/instances/InstanceComputeSelect/PresetSelect";
import VmInitialDiskEditor from "../VmInitialDiskEditor";
import VmNetworkFields from "../VmNetworkFields";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";

type VmCreateModalProps = { onCancel: () => void; onCreated: () => void };
type VmCreateFormValues = {
  name: string;
  preset?: InstancePreset;
  media_key: string;
  system_disk_size_gb: number;
  data_disks: VmInitialDisk[];
  vpc_id: string;
  subnet_id: string;
  start_after_create: boolean;
  dns_mode: VmDns["mode"];
  nameservers: string;
  initialize_guest: boolean;
  username: string;
  password: string;
  ssh_public_key: string;
};
const MEDIA_KIND_LABELS: Record<VmMedia["kind"], string> = {
  DISK_IMAGE: "磁盘镜像",
  INSTALL_ISO: "安装 ISO",
  DRIVER_ISO: "驱动 ISO",
};
const INITIAL: VmCreateFormValues = {
  name: "",
  media_key: "",
  system_disk_size_gb: 30,
  data_disks: [],
  vpc_id: "",
  subnet_id: "",
  start_after_create: false,
  dns_mode: "PLATFORM_DEFAULT",
  nameservers: "",
  initialize_guest: false,
  username: "",
  password: "",
  ssh_public_key: "",
};
export default function VmCreateModal({ onCancel, onCreated }: VmCreateModalProps) {
  const [form] = Form.useForm<VmCreateFormValues>();
  const [values, setValues] = useState(INITIAL);
  const qc = useQueryClient();
  const media = useQuery({
    queryKey: ["vm-media"],
    queryFn: ({ signal }) => listVmMedia(signal),
    meta: { errorNotification: { id: "vm-media", action: "虚拟机介质加载" } },
  });
  const selected = media.data?.items.find((item) => item.mediaKey === values.media_key);
  const canInitialize =
    selected?.kind === "DISK_IMAGE" &&
    selected.osFamily === "linux" &&
    selected.initializationVerified &&
    selected.initializationCapability === "CLOUD_INIT_NOCLOUD";
  const create = useMutation({
    mutationFn: createVm,
    meta: { feedback: { channel: "message", action: "创建云主机", successText: "创建已提交" } },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vms", "list"] });
      onCreated();
    },
  });
  const submit = async () => {
    if (create.isPending) return;
    try {
      const current = await validateForm<VmCreateFormValues>(form);
      const source = media.data?.items.find((item) => item.mediaKey === current.media_key);
      if (
        !current.preset?.selectable ||
        !current.preset.enabled ||
        current.preset.compute_type !== "cpu" ||
        !source ||
        source.kind === "DRIVER_ISO"
      ) {
        showMessage({ type: "error", content: "请选择可用的 CPU 算力规格和系统介质" });
        return;
      }
      await create.mutateAsync({
        name: current.name.trim(),
        preset_id: current.preset.id,
        source_kind: source.kind,
        media_key: current.media_key,
        system_disk_size_gb: String(current.system_disk_size_gb),
        data_disks: current.data_disks.map((disk) => ({ ...disk, name: disk.name.trim() })),
        network: { vpc_id: current.vpc_id, subnet_id: current.subnet_id },
        start_after_create: current.start_after_create,
        dns:
          current.dns_mode === "CUSTOM"
            ? { mode: "CUSTOM", nameservers: current.nameservers.split(/[,\s]+/).filter(Boolean) }
            : { mode: "PLATFORM_DEFAULT" },
        guest_initialization:
          canInitialize && current.initialize_guest
            ? {
                username: current.username.trim(),
                password: current.password || undefined,
                ssh_public_key: current.ssh_public_key.trim() || undefined,
              }
            : undefined,
      });
    } catch {
      /* 字段校验及 mutation 统一反馈。 */
    }
  };
  return (
    <Modal
      visible
      title="创建云主机"
      style={{ width: 780 }}
      onCancel={() => {
        if (!create.isPending) onCancel();
      }}
      onOk={submit}
      confirmLoading={create.isPending}
    >
      <Form<VmCreateFormValues>
        form={form}
        layout="vertical"
        initialValues={INITIAL}
        disabled={create.isPending}
        onValuesChange={(changed) => setValues((current) => ({ ...current, ...changed }))}
      >
        <Form.Item
          field="name"
          label="名称"
          rules={[{ required: true, message: "请输入名称" }, { maxLength: 128 }]}
        >
          <Input maxLength={128} />
        </Form.Item>
        <Form.Item
          field="preset"
          label="算力规格"
          rules={[{ required: true, message: "请选择算力规格" }]}
        >
          <InstanceComputePresetSelect usage="VIRTUAL_MACHINE" computeType="cpu" />
        </Form.Item>
        <Form.Item
          field="media_key"
          label="系统介质"
          rules={[{ required: true, message: "请选择系统介质" }]}
        >
          <Select
            loading={media.isFetching}
            placeholder="选择磁盘镜像或安装 ISO"
            options={media.data?.items
              .filter((item) => item.kind === "DISK_IMAGE" || item.kind === "INSTALL_ISO")
              .map((item) => ({
                value: item.mediaKey,
                label: (
                  <Space size={8}>
                    <Tag size="small">{MEDIA_KIND_LABELS[item.kind]}</Tag>
                    <span>{item.name}</span>
                  </Space>
                ),
              }))}
            onChange={() => {
              form.setFieldsValue({
                initialize_guest: false,
                username: "",
                password: "",
                ssh_public_key: "",
              });
              setValues((current) => ({ ...current, initialize_guest: false }));
            }}
          />
        </Form.Item>
        <Form.Item
          field="system_disk_size_gb"
          label="系统盘容量 (GB)"
          rules={[{ required: true, message: "请输入系统盘容量" }]}
        >
          <InputNumber min={1} max={9223372036} precision={0} />
        </Form.Item>
        <VmNetworkFields
          vpcId={values.vpc_id}
          onVpcChange={() => form.setFieldValue("subnet_id", "")}
        />
        <Form.Item field="start_after_create" label="创建后开机" triggerPropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          field="data_disks"
          label="初始数据盘"
          rules={[
            {
              validator: (disks: VmInitialDisk[] | undefined, cb) =>
                cb(
                  disks?.some((disk) => !disk.name.trim() || !Number(disk.size_gb))
                    ? "请填写数据盘名称和容量"
                    : undefined,
                ),
            },
          ]}
        >
          <VmInitialDiskEditor />
        </Form.Item>
        <Form.Item field="dns_mode" label="DNS 模式">
          <Radio.Group
            type="button"
            aria-label="DNS 模式"
            options={[
              { value: "PLATFORM_DEFAULT", label: "平台默认" },
              { value: "CUSTOM", label: "自定义" },
            ]}
          />
        </Form.Item>
        {values.dns_mode === "CUSTOM" && (
          <Form.Item
            field="nameservers"
            label="DNS 服务器"
            extra="填写 1–3 个 IP 地址，以逗号或空格分隔"
            rules={[{ required: true, message: "请输入 DNS 服务器" }]}
          >
            <Input />
          </Form.Item>
        )}
        {canInitialize && (
          <Collapse>
            <Collapse.Item name="guest" header="来宾系统初始化">
              <Form.Item field="initialize_guest" triggerPropName="checked">
                <Checkbox>初始化登录用户</Checkbox>
              </Form.Item>
              {values.initialize_guest && (
                <>
                  <Form.Item
                    field="username"
                    label="用户名"
                    rules={[{ required: true, message: "请输入用户名" }]}
                  >
                    <Input maxLength={32} />
                  </Form.Item>
                  <Form.Item
                    field="password"
                    label="密码"
                    extra="密码与 SSH 公钥至少填写一项"
                    rules={[
                      {
                        validator: (password, cb) =>
                          cb(
                            !password && !String(form.getFieldValue("ssh_public_key") ?? "").trim()
                              ? "请输入密码或 SSH 公钥"
                              : password && (password.length < 8 || password.length > 128)
                                ? "密码长度为 8–128 个字符"
                                : undefined,
                          ),
                      },
                    ]}
                  >
                    <Input.Password autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item field="ssh_public_key" label="SSH 公钥">
                    <Input.TextArea placeholder="ssh-ed25519 ..." />
                  </Form.Item>
                </>
              )}
            </Collapse.Item>
          </Collapse>
        )}
      </Form>
    </Modal>
  );
}
