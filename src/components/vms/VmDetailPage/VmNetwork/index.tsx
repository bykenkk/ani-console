import { Descriptions } from "@arco-design/web-react";
import type { VirtualMachine, VmResourceReference } from "@/api/vms";
import { DataTable } from "@/components/common";
import VmIpAddresses from "./VmIpAddresses";
import InstanceNetworkInterfaces from "@/components/instances/InstanceNetworkInterfaces";

type VmNetworkProps = { vm: VirtualMachine; busy: boolean };

export default function VmNetwork({ vm, busy }: VmNetworkProps) {
  const referenceName = (reference?: VmResourceReference) =>
    reference?.name || (reference?.state === "NOT_FOUND" ? "资源不可用" : "名称暂不可用");
  return (
    <div className="flex flex-col gap-4">
      <InstanceNetworkInterfaces
        consumerKind="vm"
        consumerId={vm.id}
        resourceVersion={vm.version}
        running={vm.observedState === "Running"}
        stopped={vm.observedState === "Stopped"}
        busy={busy}
      />
      <Descriptions
        title="网络配置"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ overflowWrap: "anywhere", verticalAlign: "top" }}
        data={[
          {
            label: "VPC",
            value: vm.relations?.vpc ? referenceName(vm.relations.vpc) : "-",
          },
          {
            label: "子网",
            value: vm.relations?.subnet ? referenceName(vm.relations.subnet) : "-",
          },
          {
            label: "IP 地址",
            span: 2,
            value: (
              <VmIpAddresses
                addresses={vm.addresses?.map((address) => address.address) ?? []}
                initialVisibleCount={2}
              />
            ),
          },
          { label: "DNS 服务器", value: vm.dns?.nameservers?.join(" · ") || "-", span: 2 },
          {
            label: "已绑定安全组",
            span: 2,
            value: vm.security_group_ids?.length ? (
              <div className="flex flex-col gap-2">
                {vm.security_group_ids.map((id) => (
                  <span key={id}>
                    {referenceName(vm.relations?.securityGroups?.find((group) => group.id === id))}
                  </span>
                ))}
              </div>
            ) : (
              "-"
            ),
          },
        ]}
      />
      <DataTable
        header={{ title: "网卡信息" }}
        data={vm.runtime?.interfaces ?? []}
        rowKey={(nic) => `${nic.name}:${nic.mac}`}
        pagination={false}
        tableLabel="云主机网卡信息"
        columns={[
          { title: "网卡名称", dataIndex: "guestName", width: 140 },
          { title: "MAC 地址", dataIndex: "mac", width: 180 },
          {
            title: "IP 地址",
            width: 230,
            render: (_, nic) => <VmIpAddresses addresses={nic.addresses ?? []} />,
          },
        ]}
      />
    </div>
  );
}
