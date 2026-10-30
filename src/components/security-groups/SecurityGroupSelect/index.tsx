import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listNetworkSecurityGroups } from "@/api/network";
import { withFirst100 } from "@/api/pagination";

const listOptions = withFirst100(listNetworkSecurityGroups);
type SecurityGroupSelectProps = {
  value?: string[];
  onChange?: (ids: string[]) => void;
  disabled?: boolean;
};
export default function SecurityGroupSelect({
  value,
  onChange,
  disabled,
}: SecurityGroupSelectProps) {
  const [name, setName] = useState("");
  const groups = useQuery({
    queryKey: ["network-security-groups", "options", { name }],
    queryFn: ({ signal }) => listOptions({ name: name.trim() || undefined }, signal),
    meta: { errorNotification: { id: "security-group-options", action: "安全组列表加载" } },
  });
  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      disabled={disabled}
      loading={groups.isFetching}
      allowClear
      showSearch
      filterOption={false}
      onSearch={setName}
      placeholder="选择安全组，最多 16 个"
      options={(groups.data?.items ?? []).map((group) => ({
        value: group.id,
        label: `${group.name} · ${group.id}`,
        disabled:
          !value?.includes(group.id) && (group.state !== "available" || (value?.length ?? 0) >= 16),
      }))}
    />
  );
}
