import { Descriptions } from "@arco-design/web-react";
import type { VirtualMachine, VmResourceReference } from "@/api/vms";
import { DataTable, ResourceNameId } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type VmNetworkProps = { vm: VirtualMachine };

export default function VmNetwork({ vm }: VmNetworkProps) {
  const referenceName = (reference?: VmResourceReference) =>
    reference?.name || (reference?.state === "NOT_FOUND" ? "资源不可用" : "名称暂不可用");
  return (
    <div className="flex flex-col gap-6">
      <Descriptions
        title="所属网络"
        column={2}
        data={[
          {
            label: "VPC",
            value: vm.relations?.vpc ? (
              <ResourceNameId
                name={referenceName(vm.relations.vpc)}
                id={vm.relations.vpc.id}
                type="vpc"
              />
            ) : (
              "-"
            ),
          },
          {
            label: "子网",
            value: vm.relations?.subnet ? (
              <ResourceNameId
                name={referenceName(vm.relations.subnet)}
                id={vm.relations.subnet.id}
                type="subnet"
              />
            ) : (
              "-"
            ),
          },
        ]}
      />
      <DataTable
        header={{ title: "网卡地址" }}
        data={vm.addresses ?? []}
        rowKey={(address) => `${address.nicName}:${address.address}`}
        pagination={false}
        tableLabel="云主机网卡地址"
        columns={[
          { title: "网卡", width: 160, dataIndex: "nicName" },
          { title: "IP 地址", width: 220, dataIndex: "address", ellipsis: true },
          {
            title: "地址观测时间",
            width: 180,
            render: (_, address) => formatDateTime(address.observedAt),
          },
        ]}
      />
      <DataTable
        header={{ title: "运行网卡（当前实例观测）" }}
        data={vm.runtime?.interfaces ?? []}
        rowKey={(nic) => `${nic.name}:${nic.mac}`}
        pagination={false}
        tableLabel="云主机运行网卡"
        columns={[
          { title: "网卡", dataIndex: "name", width: 140 },
          { title: "来宾网卡", dataIndex: "guestName", width: 140 },
          { title: "MAC", dataIndex: "mac", width: 180 },
          { title: "观测地址", width: 230, render: (_, nic) => nic.addresses?.join(" · ") || "-" },
          { title: "来源", dataIndex: "infoSource", width: 180 },
          { title: "观测时间", width: 180, render: () => formatDateTime(vm.runtime?.observedAt) },
        ]}
      />
      <Descriptions
        title="DNS 设置"
        column={1}
        data={[
          {
            label: "配置方式",
            value:
              vm.dns?.mode === "PLATFORM_DEFAULT"
                ? "创建时的平台默认配置"
                : vm.dns?.mode === "CUSTOM"
                  ? "自定义"
                  : "-",
          },
          { label: "DNS 服务器", value: vm.dns?.nameservers?.join(" · ") || "-" },
        ]}
      />
      <Descriptions
        title="安全组"
        column={1}
        data={[
          {
            label: "已绑定安全组",
            value: vm.security_group_ids?.length ? (
              <div className="flex flex-col gap-2">
                {vm.security_group_ids.map((id) => (
                  <ResourceNameId
                    key={id}
                    name={referenceName(
                      vm.relations?.securityGroups?.find((group) => group.id === id),
                    )}
                    id={id}
                    type="security-group"
                  />
                ))}
              </div>
            ) : (
              "-"
            ),
          },
        ]}
      />
    </div>
  );
}
