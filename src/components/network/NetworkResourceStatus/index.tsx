import { StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type NetworkResourceStatusProps = {
  resource: {
    state: string;
    reason?: string | null;
    reason_message?: string | null;
    observation_stale?: boolean;
    observed_at?: string | null;
  };
};

export default function NetworkResourceStatus({ resource }: NetworkResourceStatusProps) {
  const stale = resource.observation_stale;
  const observation = stale
    ? `当前状态待确认，最后确认时间：${resource.observed_at ? formatDateTime(resource.observed_at) : "暂无"}`
    : undefined;
  return (
    <StatusBadge
      status={resource.state}
      reason={resource.reason}
      message={[resource.reason_message, observation].filter(Boolean).join("；")}
      tone={stale ? "warning" : undefined}
    >
      {stale ? `${resource.state} · 待确认` : resource.state}
    </StatusBadge>
  );
}
