import type { ReactNode } from "react";
import { Button } from "@arco-design/web-react";
import { IconPlayArrowFill, IconRecordStop, IconRefresh } from "@arco-design/web-react/icon";

type LogToolbarProps = {
  children?: ReactNode;
  follow: {
    active: boolean;
    disabled?: boolean;
    startLabel?: string;
    stopLabel?: string;
    onChange: (active: boolean) => void;
  };
  refresh: {
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
  };
};

export default function LogToolbar({ children, follow, refresh }: LogToolbarProps) {
  const followLabel = follow.active
    ? (follow.stopLabel ?? "停止跟随")
    : (follow.startLabel ?? "实时跟随");
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="small"
          icon={follow.active ? <IconRecordStop /> : <IconPlayArrowFill />}
          aria-label={followLabel}
          title={followLabel}
          disabled={follow.disabled}
          onClick={() => follow.onChange(!follow.active)}
        />
        <Button
          size="small"
          icon={<IconRefresh />}
          aria-label="刷新日志"
          title="刷新日志"
          disabled={follow.active || refresh.disabled}
          loading={refresh.loading}
          onClick={refresh.onClick}
        />
      </div>
    </div>
  );
}
