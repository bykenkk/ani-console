import type { VirtualMachine } from "@/api/vms";
import { Button, Descriptions, Space } from "@arco-design/web-react";
import { vmIsClosed } from "@/lib/vms";

type VmSshAccessProps = { vm: VirtualMachine; onOpenConsole: () => void };

export default function VmSshAccess({ vm, onOpenConsole }: VmSshAccessProps) {
  // TODO(vm-ssh): 新契约未提供 SSH 用户名、端口、密钥和就绪状态，保留字段与入口，补齐后恢复连接命令。
  return (
    <Space direction="vertical" className="w-full">
      <Descriptions
        title="SSH 连接信息"
        column={1}
        labelStyle={{ width: "120px" }}
        data={[
          { label: "连接状态", value: "-" },
          { label: "用户名", value: "-" },
          { label: "地址", value: "-" },
          { label: "登录密钥", value: "-" },
        ]}
      />
      <Space>
        <Button type="primary" disabled title="SSH 连接信息暂不可用">
          复制 SSH 命令
        </Button>
        <Button disabled={vmIsClosed(vm) || vm.observedState !== "Running"} onClick={onOpenConsole}>
          打开控制台
        </Button>
      </Space>
    </Space>
  );
}
