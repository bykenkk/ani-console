import { useState } from "react";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkSubnets } from "@/api/network";

type VnicSubnetSelectProps = { value?: string; onChange: (value: string | undefined) => void };
export default function VnicSubnetSelect({ value, onChange }: VnicSubnetSelectProps) {
  const [name, setName] = useState("");
  const subnets = useQuery({
    queryKey: ["network-subnets", "vnic-filter", "options", name],
    // TODO(subnet-pagination): 既有子网目录仍为游标合同；只取首批，待页码改造后改用 withFirst100。
    queryFn: ({ signal }) =>
      listNetworkSubnets({ name: name.trim() || undefined, limit: 100 }, signal),
    meta: { errorNotification: { id: "subnets", action: "子网选项加载" } },
  });
  return (
    <Select
      aria-label="子网筛选"
      placeholder="全部子网"
      allowClear
      showSearch
      filterOption={false}
      onSearch={setName}
      value={value}
      onChange={onChange}
      loading={subnets.isFetching}
      style={{ width: 220 }}
      options={(subnets.data?.items ?? []).map((subnet) => ({
        value: subnet.id,
        label: `${subnet.name} · ${subnet.cidr}`,
      }))}
    />
  );
}
