import { Tag, Tooltip } from "@arco-design/web-react";
import { IconLoading } from "@arco-design/web-react/icon";
import clsx from "clsx";
import { Children, type ReactNode } from "react";
import styles from "./index.module.css";

export type StatusBadgeTone = "primary" | "success" | "warning" | "danger" | "neutral";

export interface StatusBadgeProps {
  status?: string | null;
  reason?: string | null;
  message?: string | null;
  children?: ReactNode;
  title?: string;
  tone?: StatusBadgeTone;
  loading?: boolean;
  /** 是否显示状态点或加载图标。 */
  showIndicator?: boolean;
  className?: string;
}

const TONE_COLOR: Record<StatusBadgeTone, "arcoblue" | "green" | "orange" | "red" | "gray"> = {
  primary: "arcoblue",
  success: "green",
  warning: "orange",
  danger: "red",
  neutral: "gray",
};

const STATUS_APPEARANCE: Record<string, { tone: StatusBadgeTone; loading?: boolean }> = {
  running: { tone: "primary" },
  ready: { tone: "success" },
  active: { tone: "success" },
  success: { tone: "success" },
  healthy: { tone: "success" },
  available: { tone: "success" },
  succeeded: { tone: "success" },
  pending: { tone: "warning", loading: true },
  accepted: { tone: "warning", loading: true },
  provisioning: { tone: "primary", loading: true },
  starting: { tone: "primary", loading: true },
  creating: { tone: "primary", loading: true },
  progressing: { tone: "primary", loading: true },
  deploying: { tone: "primary", loading: true },
  parsing: { tone: "primary", loading: true },
  indexing: { tone: "primary", loading: true },
  in_progress: { tone: "primary", loading: true },
  stopping: { tone: "warning", loading: true },
  deleting: { tone: "danger", loading: true },
  stopped: { tone: "danger" },
  failed: { tone: "danger" },
  error: { tone: "danger" },
  paused: { tone: "warning" },
  degraded: { tone: "warning" },
  warning: { tone: "warning" },
  rolled_back: { tone: "warning" },
  deleted: { tone: "neutral" },
  expired: { tone: "neutral" },
  cancelled: { tone: "neutral" },
};

export default function StatusBadge({
  status,
  reason,
  message,
  children,
  title,
  tone,
  loading,
  showIndicator = true,
  className,
}: StatusBadgeProps) {
  const appearance = STATUS_APPEARANCE[status?.toLowerCase() ?? ""];
  const resolvedTone = tone ?? appearance?.tone ?? "neutral";
  const resolvedLoading = loading ?? appearance?.loading ?? false;
  const content = children ?? (status || "-");
  const contentTitle = Children.toArray(content)
    .filter((child) => typeof child === "string" || typeof child === "number")
    .join("");
  const indicatorIcon = !showIndicator ? undefined : resolvedLoading ? (
    <IconLoading className={styles.loadingIcon} aria-hidden="true" />
  ) : (
    <span className={styles.dot} aria-hidden="true" />
  );

  const badge = (
    <Tag
      color={TONE_COLOR[resolvedTone]}
      bordered={false}
      className={clsx(styles.indicator, className)}
      title={title ?? (contentTitle || undefined)}
      icon={indicatorIcon}
      aria-busy={resolvedLoading || undefined}
    >
      {content}
    </Tag>
  );
  const tooltipReason = reason?.trim();
  const tooltipMessage = message?.trim();
  if (!tooltipReason && !tooltipMessage) return badge;

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1 wrap-anywhere whitespace-pre-wrap">
          {tooltipReason && <div className="font-semibold">{tooltipReason}</div>}
          {tooltipMessage && <div>{tooltipMessage}</div>}
        </div>
      }
    >
      <span className={styles.tooltipTrigger}>{badge}</span>
    </Tooltip>
  );
}
