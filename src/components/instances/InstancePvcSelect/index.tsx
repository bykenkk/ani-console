import { useState } from "react";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import { listInstanceMountablePvcs } from "@/api/instances";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

type InstancePvcSelectProps = {
  instanceId: string;
  value?: string;
  onChange?: (value: string) => void;
};

export default function InstancePvcSelect({ instanceId, value, onChange }: InstancePvcSelectProps) {
  const [search, setSearch] = useState("");
  const name = useDebounce(search.trim(), { wait: 300 });
  const query = useQuery({
    queryKey: ["instance-mountable-pvcs", instanceId, "options", name],
    queryFn: ({ signal }) =>
      withFirst100((params, signal) => listInstanceMountablePvcs(instanceId, params, signal))(
        { name: name || undefined },
        signal,
      ),
    meta: {
      errorNotification: {
        id: withId("instance-mountable-pvcs", instanceId),
        action: "可挂载卷加载",
      },
    },
  });
  return (
    <Select
      value={value}
      onChange={onChange}
      showSearch
      filterOption={false}
      onSearch={setSearch}
      loading={query.isFetching}
      placeholder="请选择已有 PVC"
      options={(query.data?.items ?? []).map((pvc) => ({
        value: pvc.pvc_name,
        label: `${pvc.pvc_name} · ${pvc.requested_capacity} · ${pvc.access_modes.join(" / ")}${pvc.unavailable_reason ? ` · ${pvc.unavailable_reason}` : ""}`,
        disabled: !pvc.selectable,
      }))}
    />
  );
}
