import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, Select } from "@arco-design/web-react";
import { listNetworkVpcs, listNetworkSubnets } from "@/api/network";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

const listVpcOptions = withFirst100(listNetworkVpcs);
type VmNetworkFieldsProps = { vpcId: string; onVpcChange: () => void };
export default function VmNetworkFields({ vpcId, onVpcChange }: VmNetworkFieldsProps) {
  const [vpcSearch, setVpcSearch] = useState("");
  const [subnetSearch, setSubnetSearch] = useState("");
  const vpcs = useQuery({
    queryKey: ["network-vpcs", "vm", "options", vpcSearch, { can_use: true }],
    queryFn: ({ signal }) =>
      listVpcOptions({ name: vpcSearch || undefined, can_use: true }, signal),
    meta: { errorNotification: { id: "vm-vpc-options", action: "VPC 加载" } },
  });
  const subnets = useQuery({
    queryKey: ["network-subnets", "vm", "options", vpcId, subnetSearch, { can_use: true }],
    enabled: Boolean(vpcId),
    // FIXME(vm-subnet-options): 后端仍为 cursor/limit。复用现有子网接口首批选项，不遍历分页；待后端迁移后改为 withFirst100。
    queryFn: ({ signal }) =>
      listNetworkSubnets(
        { vpc_id: vpcId, name: subnetSearch || undefined, limit: 100, can_use: true },
        signal,
      ),
    meta: { errorNotification: { id: withId("vm-subnet-options", vpcId), action: "子网加载" } },
  });
  return (
    <div className="grid grid-cols-2 gap-4">
      <Form.Item field="vpc_id" label="VPC" rules={[{ required: true, message: "请选择 VPC" }]}>
        <Select
          showSearch
          filterOption={false}
          onSearch={setVpcSearch}
          loading={vpcs.isFetching}
          placeholder="请选择 VPC"
          options={vpcs.data?.items.map((item) => ({
            value: item.id,
            label: `${item.name}${item.owner_scope === "platform" ? " · 平台基础网络" : ""} · ${item.cidr || "-"}`,
          }))}
          onChange={() => {
            setSubnetSearch("");
            onVpcChange();
          }}
        />
      </Form.Item>
      <Form.Item field="subnet_id" label="子网" rules={[{ required: true, message: "请选择子网" }]}>
        <Select
          showSearch
          filterOption={false}
          onSearch={setSubnetSearch}
          disabled={!vpcId}
          loading={subnets.isFetching}
          placeholder="请选择子网"
          options={subnets.data?.items.map((item) => ({
            value: item.id,
            label: `${item.name}${item.owner_scope === "platform" ? " · 平台基础网络" : ""} · ${item.cidr || "-"}`,
          }))}
        />
      </Form.Item>
    </div>
  );
}
