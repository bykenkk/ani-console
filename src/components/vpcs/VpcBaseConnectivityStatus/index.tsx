import { Typography } from "@arco-design/web-react";
import type { NetworkVpcBaseConnectivity } from "@/api/network";
import { StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type VpcBaseConnectivityStatusProps = {
  connectivity?: NetworkVpcBaseConnectivity;
  compact?: boolean;
};

const STATE_LABEL: Record<NetworkVpcBaseConnectivity["state"], string> = {
  missing: "未配置",
  pending: "配置中",
  ready: "配置就绪",
  degraded: "配置异常",
  deleting: "删除中",
  deleted: "已删除",
  unknown: "待观测",
};

export default function VpcBaseConnectivityStatus({
  connectivity,
  compact = false,
}: VpcBaseConnectivityStatusProps) {
  const stale = connectivity?.observation_stale;
  const explanation = connectivity?.reason_message || connectivity?.reason;
  return (
    <div className="flex flex-col items-start gap-1 wrap-anywhere">
      <StatusBadge
        status={connectivity?.state}
        tone={stale ? "warning" : undefined}
        reason={connectivity?.reason}
        message={connectivity?.reason_message}
      >
        {STATE_LABEL[connectivity?.state ?? "unknown"] ?? STATE_LABEL.unknown}
      </StatusBadge>
      {stale && <Typography.Text type="warning">观测过期</Typography.Text>}
      {!compact && (
        <>
          {explanation && <Typography.Text type="secondary">{explanation}</Typography.Text>}
          <Typography.Text type="secondary">
            观测时间：{formatDateTime(connectivity?.observed_at)}
          </Typography.Text>
        </>
      )}
    </div>
  );
}
