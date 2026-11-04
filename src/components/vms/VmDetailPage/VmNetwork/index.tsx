import { Descriptions } from "@arco-design/web-react";
import type { VirtualMachine, VmResourceReference } from "@/api/vms";
import VmIpAddresses from "./VmIpAddresses";
import VmNetworkInterfaces from "@/components/vms/VmNetworkInterfaces";
import NetworkReferenceName from "@/components/network/NetworkReferenceName";

type VmNetworkProps = { vm: VirtualMachine };

export default function VmNetwork({ vm }: VmNetworkProps) {
  const referenceName = (reference?: VmResourceReference) =>
    reference?.name || (reference?.state === "NOT_FOUND" ? "资源不可用" : "名称暂不可用");
  return (
    <div className="flex flex-col gap-4">
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
            value: vm.relations?.vpc?.id ? (
              <NetworkReferenceName
                kind="vpc"
                id={vm.relations.vpc.id}
                name={vm.relations.vpc.name}
              />
            ) : (
              "-"
            ),
          },
          {
            label: "子网",
            value: vm.relations?.subnet?.id ? (
              <NetworkReferenceName
                kind="subnet"
                id={vm.relations.subnet.id}
                name={vm.relations.subnet.name}
              />
            ) : (
              "-"
            ),
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
      <VmNetworkInterfaces vm={vm} />
    </div>
  );
}
