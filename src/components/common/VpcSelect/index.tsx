import { Select, type SelectProps } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listNetworkVpcs, type NetworkVPC } from "@/api/network";
import { withFirst100 } from "@/api/pagination";

const listVpcOptions = withFirst100(listNetworkVpcs);

type VpcSelectProps = Pick<
  SelectProps,
  "disabled" | "allowClear" | "placeholder" | "onBlur" | "className" | "style"
> & {
  value?: string;
  onChange?: (id: string | undefined, vpc: NetworkVPC | undefined) => void;
  "aria-label"?: string;
  canUse?: boolean;
  canManage?: boolean;
};

export default function VpcSelect({
  canUse,
  canManage,
  disabled,
  onChange,
  ...props
}: VpcSelectProps) {
  const [name, setName] = useState("");
  const params = { name: name.trim() || undefined, can_use: canUse, can_manage: canManage };
  const vpcs = useQuery({
    queryKey: ["network-vpcs", "options", params],
    queryFn: ({ signal }) => listVpcOptions(params, signal),
    enabled: !disabled,
    meta: { errorNotification: { id: "vpc-options", action: "VPC 选项加载" } },
  });

  return (
    <Select
      placeholder="请选择 VPC"
      {...props}
      onChange={(id) =>
        onChange?.(
          id,
          vpcs.data?.items.find((vpc) => vpc.id === id),
        )
      }
      disabled={disabled}
      loading={vpcs.isFetching}
      showSearch
      filterOption={false}
      onSearch={setName}
      options={(vpcs.data?.items ?? []).map((vpc) => ({
        value: vpc.id,
        label: `${vpc.name}${vpc.owner_scope === "platform" ? " · 平台基础网络" : ""} · ${vpc.cidr || "-"}`,
      }))}
    />
  );
}
