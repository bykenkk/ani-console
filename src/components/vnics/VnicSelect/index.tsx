import { useState } from "react";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkVnics, type VnicConsumerKind } from "@/api/network";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

const listOptions = withFirst100(listNetworkVnics);
type VnicSelectProps = {
  consumerKind: VnicConsumerKind;
  consumerId: string;
  value?: string;
  onChange: (value: string) => void;
};
export default function VnicSelect({ consumerKind, consumerId, value, onChange }: VnicSelectProps) {
  const [name, setName] = useState("");
  const options = useQuery({
    queryKey: ["network-vnics", "options", { consumerKind, consumerId, name }],
    queryFn: ({ signal }) =>
      listOptions(
        {
          bindable_to_kind: consumerKind,
          bindable_to_id: consumerId,
          name: name.trim() || undefined,
        },
        signal,
      ),
    meta: { errorNotification: { id: withId("vnic-options", consumerId), action: "可用网卡加载" } },
  });
  return (
    <Select
      placeholder="选择手动网卡"
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
