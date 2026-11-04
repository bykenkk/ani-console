import { useState } from "react";
import { Button } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import { copyToClipboard } from "@/lib/clipboard";

type VmIpAddressesProps = {
  addresses: string[];
  initialVisibleCount?: number;
};

export default function VmIpAddresses({ addresses, initialVisibleCount }: VmIpAddressesProps) {
  const [expanded, setExpanded] = useState(false);
  const uniqueAddresses = Array.from(new Set(addresses));
  const limit = initialVisibleCount ?? uniqueAddresses.length;
  const visibleAddresses = expanded ? uniqueAddresses : uniqueAddresses.slice(0, limit);
  const hasMore = uniqueAddresses.length > limit;

  if (!uniqueAddresses.length) return "-";

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      {visibleAddresses.map((address) => (
        <div key={address} className="flex max-w-full min-w-0 items-start gap-1">
          <span className="min-w-0 font-mono wrap-anywhere">{address}</span>
          <Button
            type="text"
            size="mini"
            className="shrink-0"
            icon={<IconCopy />}
            title="复制 IP 地址"
            aria-label={`复制 IP 地址 ${address}`}
            onClick={() => {
              copyToClipboard(address, "IP 地址");
            }}
          />
        </div>
      ))}
      {hasMore && (
        <Button
          type="text"
          size="mini"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "收起" : `查看全部（${uniqueAddresses.length}）`}
        </Button>
      )}
    </div>
  );
}
