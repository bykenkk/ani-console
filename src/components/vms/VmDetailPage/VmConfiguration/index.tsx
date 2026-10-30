import { Alert, Descriptions } from "@arco-design/web-react";
import type { VirtualMachine } from "@/api/vms";

export default function VmConfiguration({ vm }: { vm: VirtualMachine }) {
  const hardware = vm.hardware;
  const initialization = vm.initialization;
  return (
    <div className="flex flex-col gap-6">
      <Alert
        type="info"
        content="以下为创建时保存的配置。当前来宾操作系统和文件系统信息请查看「来宾信息」。"
      />
      <Descriptions
        title="虚拟硬件"
        column={2}
        data={[
          { label: "架构", value: hardware?.architecture || "-" },
          { label: "固件", value: hardware?.firmware?.toUpperCase() || "-" },
          {
            label: "CPU 拓扑",
            value: hardware
              ? `${hardware.sockets} 插槽 × ${hardware.cores} 核 × ${hardware.threads} 线程`
              : "-",
          },
          { label: "系统盘总线", value: hardware?.rootBus || "-" },
          { label: "数据盘总线", value: hardware?.dataBus || "-" },
          { label: "网卡型号", value: hardware?.nicModel || "-" },
          {
            label: "持久 TPM",
            value: hardware ? (hardware.persistentTpm ? "启用" : "未启用") : "-",
          },
          {
            label: "持久 UEFI 状态",
            value: hardware ? (hardware.persistentUefi ? "启用" : "未启用") : "-",
          },
        ]}
      />
      <Descriptions
        title="系统初始化"
        column={1}
        data={[
          {
            label: "初始化方式",
            value:
              initialization?.method === "NONE"
                ? "无自动初始化"
                : initialization?.method === "CLOUD_INIT_NOCLOUD"
                  ? "Cloud-init（NoCloud）"
                  : initialization?.method || "-",
          },
          { label: "初始用户名", value: initialization?.username || "-" },
          { label: "SSH 公钥指纹", value: initialization?.sshKeyFingerprint || "-" },
        ]}
      />
    </div>
  );
}
