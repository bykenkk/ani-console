import { Alert, Descriptions } from "@arco-design/web-react";
import type { VirtualMachine } from "@/api/vms";

type VmConfigurationProps = { vm: VirtualMachine };

export default function VmConfiguration({ vm }: VmConfigurationProps) {
  const hardware = vm.hardware;
  const initialization = vm.initialization;
  return (
    <div className="flex flex-col gap-4">
      <Alert
        type="info"
        content="以下为创建时的配置，当前操作系统及文件系统信息请查看「系统信息」。"
      />
      <Descriptions
        title="虚拟硬件"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ overflowWrap: "anywhere", verticalAlign: "top" }}
        data={[
          { label: "处理器架构", value: hardware?.architecture || "-" },
          {
            label: "CPU 拓扑",
            value: hardware
              ? `${hardware.sockets} 插槽 × ${hardware.cores} 核 × ${hardware.threads} 线程`
              : "-",
          },
          { label: "固件类型", value: hardware?.firmware?.toUpperCase() || "-" },
          { label: "网卡型号", value: hardware?.nicModel || "-" },
          { label: "系统盘总线", value: hardware?.rootBus || "-" },
          { label: "数据盘总线", value: hardware?.dataBus || "-" },
          {
            label: "TPM 持久化",
            value: hardware ? (hardware.persistentTpm ? "已启用" : "未启用") : "-",
          },
          {
            label: "UEFI 状态持久化",
            value: hardware ? (hardware.persistentUefi ? "已启用" : "未启用") : "-",
          },
        ]}
      />
      <Descriptions
        title="系统初始化"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ overflowWrap: "anywhere", verticalAlign: "top" }}
        data={[
          {
            label: "初始化方式",
            value:
              initialization?.method === "NONE"
                ? "不自动初始化"
                : initialization?.method === "CLOUD_INIT_NOCLOUD"
                  ? "Cloud-init（NoCloud）"
                  : initialization?.method || "-",
          },
          { label: "初始用户名", value: initialization?.username || "-" },
          { label: "SSH 公钥指纹", value: initialization?.sshKeyFingerprint || "-", span: 2 },
        ]}
      />
    </div>
  );
}
