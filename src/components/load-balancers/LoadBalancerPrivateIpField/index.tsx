import { ipRangePage } from "./utils";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import type { LoadBalancerConfigurationFormValues } from "../CreateLoadBalancerModal";
import { subnetIpUnavailableReason } from "@/lib/subnets";
import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getNetworkSubnet } from "@/api/network";
import { withId } from "@/lib/id";
import { ipInRanges, parseIpRanges } from "@/lib/subnets";

type LoadBalancerPrivateIpFieldProps = {
  subnetId?: string;
  onAvailabilityChange: (available: boolean) => void;
  form: Pick<FormInstance<LoadBalancerConfigurationFormValues>, "setFieldValue" | "getFieldValue">;
};

export default function LoadBalancerPrivateIpField({
  subnetId,
  form,
  onAvailabilityChange,
}: LoadBalancerPrivateIpFieldProps) {
  const [visibleCount, setVisibleCount] = useState(100);
  const [search, setSearch] = useState("");
  const subnet = useQuery({
    queryKey: ["network-subnet", subnetId],
    queryFn: () => getNetworkSubnet(subnetId!),
    enabled: !!subnetId,
    meta: {
      errorNotification: {
        id: withId("subnet", subnetId ?? ""),
        action: "可用地址加载",
        fallback: "请求失败，请重试",
      },
    },
  });
  const ranges = parseIpRanges(subnet.data?.available_ip_range) ?? [];
  const reason = subnet.isError ? "地址加载失败" : subnetIpUnavailableReason(subnet.data);
  const blocked = !subnetId || subnet.isFetching || !!reason;
  useEffect(() => {
    onAvailabilityChange(!blocked);
  }, [blocked, onAvailabilityChange]);
  const options = search.trim()
    ? ipInRanges(ranges, search.trim())
      ? [search.trim()]
      : []
    : ipRangePage(ranges, 0, visibleCount);
  useEffect(() => {
    const current = form.getFieldValue("vip");
    if (
      subnet.isError ||
      subnetIpUnavailableReason(subnet.data) ||
      !ipInRanges(
        parseIpRanges(subnet.data?.available_ip_range) ?? [],
        typeof current === "string" ? current : "",
      )
    ) {
      form.setFieldValue("vip", undefined);
    }
  }, [subnet.data, subnet.isError, form]);
  return (
    <Form.Item
      label="指定 IP"
      field="vip"
      rules={[
        { required: true, message: "请选择指定 IP" },
        {
          validator: (value, callback) =>
            callback(
              blocked || !ipInRanges(ranges, value ?? "")
                ? (reason ?? "请选择当前可用的地址")
                : undefined,
            ),
        },
      ]}
    >
      <Select
        disabled={blocked}
        loading={subnet.isFetching}
        allowClear
        showSearch
        filterOption={false}
        placeholder="请选择 IP"
        onSearch={setSearch}
        onPopupScroll={(element) => {
          if (!search && element.scrollTop + element.clientHeight >= element.scrollHeight - 16) {
            setVisibleCount((count) => count + 100);
          }
        }}
        options={options.map((address) => ({ value: address, label: address }))}
      />
    </Form.Item>
  );
}
