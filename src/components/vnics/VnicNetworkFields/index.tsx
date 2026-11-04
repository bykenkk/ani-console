import { useState } from "react";
import { Form, Select } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { useQuery } from "@tanstack/react-query";
import { listNetworkVpcs, listNetworkSubnets } from "@/api/network";
import { withFirst100 } from "@/api/pagination";

const listVpcOptions = withFirst100(listNetworkVpcs);
type VnicNetworkFieldsProps = {
  form: Pick<FormInstance, "setFieldValue">;
  onSubnetChange: (id: string) => void;
};
export default function VnicNetworkFields({ form, onSubnetChange }: VnicNetworkFieldsProps) {
  const [vpcId, setVpcId] = useState("");
  const [vpcName, setVpcName] = useState("");
  const [subnetName, setSubnetName] = useState("");
  const vpcs = useQuery({
    queryKey: ["network-vpcs", "vnic", "options", vpcName, { can_use: true }],
    queryFn: ({ signal }) =>
      listVpcOptions({ name: vpcName.trim() || undefined, can_use: true }, signal),
    meta: { errorNotification: { id: "vpcs", action: "VPC 选项加载" } },
  });
  const subnets = useQuery({
    queryKey: ["network-subnets", "vnic", "options", vpcId, subnetName, { can_use: true }],
    // TODO(subnet-pagination): 沿用现有正式子网目录的首批选项；后端迁为页码分页后改用 withFirst100，不遍历游标。
    queryFn: ({ signal }) =>
      listNetworkSubnets(
        { vpc_id: vpcId, name: subnetName.trim() || undefined, limit: 100, can_use: true },
        signal,
      ),
    enabled: Boolean(vpcId),
    meta: { errorNotification: { id: "subnets", action: "子网选项加载" } },
  });
  return (
    <>
      <Form.Item field="vpc" label="VPC" rules={[{ required: true, message: "请选择 VPC" }]}>
        <Select
          showSearch
          filterOption={false}
          onSearch={setVpcName}
          onChange={(id) => {
            setVpcId(id);
            setSubnetName("");
            onSubnetChange("");
            form.setFieldValue("subnet", undefined);
          }}
          loading={vpcs.isFetching}
          options={(vpcs.data?.items ?? []).map((vpc) => ({
            value: vpc.id,
            label: `${vpc.name}${vpc.owner_scope === "platform" ? " · 平台基础网络" : ""} · ${vpc.cidr || "-"}`,
          }))}
        />
      </Form.Item>
      <Form.Item field="subnet" label="子网" rules={[{ required: true, message: "请选择子网" }]}>
        <Select
          showSearch
          filterOption={false}
          onSearch={setSubnetName}
          onChange={onSubnetChange}
          disabled={!vpcId}
          loading={subnets.isFetching}
          options={(subnets.data?.items ?? []).map((subnet) => ({
            value: subnet.id,
            label: `${subnet.name}${subnet.owner_scope === "platform" ? " · 平台基础网络" : ""} · ${subnet.cidr || "-"}`,
          }))}
        />
      </Form.Item>
    </>
  );
}
