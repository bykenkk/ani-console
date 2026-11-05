import { useState } from "react";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkVnics, type VnicConsumerKind } from "@/api/network";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

const listOptions = withFirst100(listNetworkVnics);
type VnicSelectProps = {
  instanceKind: VnicConsumerKind;
  instanceId: string;
  value?: string;
  onChange: (value: string | undefined) => void;
};
export default function VnicSelect({ instanceKind, instanceId, value, onChange }: VnicSelectProps) {
  const [name, setName] = useState("");
  const options = useQuery({
    queryKey: ["network-vnics", "options", { instanceKind, instanceId, name }],
    queryFn: ({ signal }) =>
      listOptions(
        {
          bindable_to_kind: instanceKind,
          bindable_to_id: instanceId,
          name: name.trim() || undefined,
        },
        signal,
      ),
    meta: { errorNotification: { id: withId("vnic-options", instanceId), action: "可用网卡加载" } },
  });
  return (
    <Select
      placeholder="请选择已有网卡"
      allowClear
      showSearch
      filterOption={false}
      onSearch={setName}
      value={value}
      onChange={onChange}
      loading={options.isFetching}
      options={(options.data?.items ?? []).map((vnic) => ({
        value: vnic.id,
        label: `${vnic.name} · ${vnic.primary_ip || vnic.ips?.join(" · ") || "地址分配中"}`,
      }))}
    />
  );
}
