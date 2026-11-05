import { Select, type SelectProps } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listNetworkSubnets } from "@/api/network";

type SubnetSelectProps = Pick<
  SelectProps,
  "disabled" | "allowClear" | "placeholder" | "onBlur" | "className" | "style"
> & {
  value?: string;
  onChange?: (id: string | undefined) => void;
  "aria-label"?: string;
  vpcId?: string;
  canUse?: boolean;
  canManage?: boolean;
};

export default function SubnetSelect({
  vpcId,
  canUse,
  canManage,
  disabled,
  ...props
}: SubnetSelectProps) {
  const [name, setName] = useState("");
  const params = {
    vpc_id: vpcId || undefined,
    name: name.trim() || undefined,
    can_use: canUse,
    can_manage: canManage,
  };
  const subnets = useQuery({
    queryKey: ["network-subnets", "options", params],
    // TODO(subnet-pagination): 子网仍为 cursor/limit，暂取首批 100 项；后端迁为 page/pageSize 后改用 withFirst100，不遍历游标。
    queryFn: ({ signal }) => listNetworkSubnets({ ...params, limit: 100 }, signal),
    enabled: !disabled,
    meta: { errorNotification: { id: "subnet-options", action: "子网选项加载" } },
  });

  return (
    <Select
      placeholder="请选择子网"
      {...props}
      disabled={disabled}
      loading={subnets.isFetching}
      showSearch
      filterOption={false}
      onSearch={setName}
      options={(subnets.data?.items ?? []).map((subnet) => ({
        value: subnet.id,
        label: `${subnet.name}${subnet.owner_scope === "platform" ? " · 平台基础网络" : ""} · ${subnet.cidr || "-"}`,
      }))}
    />
  );
}
