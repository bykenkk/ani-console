import { useState } from "react";
import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listVnicBindingTargets, type VnicConsumerKind } from "@/api/network";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

const listOptions = withFirst100(
  (
    params: {
      vnicId: string;
      consumer_kind: VnicConsumerKind;
      name?: string;
      page?: number;
      pageSize?: number;
    },
    signal?: AbortSignal,
  ) => {
    const { vnicId, ...filters } = params;
    return listVnicBindingTargets(vnicId, filters, signal);
  },
);
type BindableInstanceSelectProps = {
  vnicId: string;
  instanceKind: VnicConsumerKind;
  value?: string;
  onChange: (id: string | undefined) => void;
};
export default function BindableInstanceSelect({
  vnicId,
  instanceKind,
  value,
  onChange,
}: BindableInstanceSelectProps) {
  const [name, setName] = useState("");
  const targets = useQuery({
    queryKey: ["vnic-binding-targets", vnicId, "options", instanceKind, name],
    queryFn: ({ signal }) =>
      listOptions({ vnicId, consumer_kind: instanceKind, name: name.trim() || undefined }, signal),
    meta: { errorNotification: { id: withId("vnic-targets", vnicId), action: "可绑定实例加载" } },
  });
  return (
    <Select
      allowClear
      showSearch
      filterOption={false}
      onSearch={setName}
      value={value}
      onChange={onChange}
      loading={targets.isFetching}
      options={(targets.data?.items ?? []).map((target) => ({
        value: target.consumer_id,
        label: `${target.name}${target.compute_type === "gpu" ? " · GPU" : ""}`,
      }))}
    />
  );
}
