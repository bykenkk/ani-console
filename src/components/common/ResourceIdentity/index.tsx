import { Button } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import type { ReactNode } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { navigateToResourceDetail, type ResourceDetailType } from "@/lib/resources";

type ResourceIdentityProps = {
  name?: string | null;
  nameSuffix?: ReactNode;
  id?: string | null;
  display?: "all" | "name" | "id";
  className?: string;
  openable?: boolean;
  copyable?: boolean;
  type?: ResourceDetailType;
};

export default function ResourceIdentity(props: ResourceIdentityProps) {
  const {
    name,
    nameSuffix,
    id,
    display = "all",
    className,
    openable = true,
    copyable = true,
  } = props;
  const navigate = useNavigate();
  const detailTarget = openable && props.type && id ? { type: props.type, id } : undefined;

  const handleOpen = () => {
    if (!detailTarget) return;
    navigateToResourceDetail(navigate, detailTarget);
  };

  const idContent = (
    <span
      className={clsx(
        "inline-flex max-w-full min-w-0 items-center gap-1",
        display === "id" && className,
      )}
    >
      <span className="min-w-0 truncate font-mono" title={id ?? undefined}>
        {id || "-"}
      </span>
      {copyable && id && (
        <Button
          title="复制资源 ID"
          className="shrink-0"
          type="text"
          size="mini"
          icon={<IconCopy />}
          aria-label="复制资源 ID"
          onClick={() => {
            copyToClipboard(id, "资源 ID");
          }}
        />
      )}
    </span>
  );

  if (display === "id") return idContent;

  return (
    <div className={clsx("flex w-0 min-w-full flex-col gap-0.5", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="block min-w-0 max-w-full truncate text-[14px] leading-5 text-app-text"
          title={name ?? undefined}
        >
          {detailTarget ? (
            <button
              type="button"
              className="max-w-full cursor-pointer overflow-hidden! border-0 bg-transparent p-0 text-left text-ellipsis whitespace-nowrap text-(--list-primary) no-underline [font:inherit]! [&:hover]:text-(--list-primary-hover) [&:hover]:no-underline"
              onClick={handleOpen}
            >
              {name || "-"}
            </button>
          ) : (
            name || "-"
          )}
        </span>
        {nameSuffix && <span className="inline-flex shrink-0 items-center">{nameSuffix}</span>}
      </div>
      {display === "all" && (
        <span className="text-[12px] leading-4 text-(--list-text-secondary)">{idContent}</span>
      )}
    </div>
  );
}
