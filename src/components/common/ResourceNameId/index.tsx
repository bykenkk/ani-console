import { useNavigate } from "@tanstack/react-router";
import { navigateToResourceDetail, type ResourceDetailType } from "@/lib/resources";
import ResourceId from "../ResourceId";

export type ResourceNameIdProps = {
  name: string;
  id?: string | null;
  openable?: boolean;
  copyable?: boolean;
  type?: ResourceDetailType;
};

export default function ResourceNameId(props: ResourceNameIdProps) {
  const { name, id, openable = true, copyable = true } = props;
  const navigate = useNavigate();
  // TODO(feature-visibility): 待对应功能支持后移除类型限制，恢复资源名称跳转。
  // const canOpen = openable && Boolean(props.type && id && id !== "-");
  const canOpen =
    openable &&
    Boolean(props.type && id && id !== "-") &&
    props.type !== "filesystem" &&
    props.type !== "vector-store" &&
    props.type !== "security-group" &&
    props.type !== "knowledge-base";

  const handleOpen = () => {
    if (!openable || !props.type || !id || id === "-") return;
    navigateToResourceDetail(navigate, { type: props.type, id });
  };

  return (
    <div className="flex w-0 min-w-full flex-col gap-0.5">
      <span className="block max-w-full truncate text-[14px] leading-5 text-app-text" title={name}>
        {canOpen ? (
          <button
            type="button"
            className="max-w-full cursor-pointer overflow-hidden! border-0 bg-transparent p-0 text-left text-ellipsis whitespace-nowrap text-(--list-primary) no-underline [font:inherit]! [&:hover]:text-(--list-primary-hover) [&:hover]:no-underline"
            onClick={handleOpen}
          >
            {name}
          </button>
        ) : (
          name
        )}
      </span>
      <span className="text-[12px] leading-4 text-(--list-text-secondary)">
        {id && id !== "-" ? <ResourceId value={id} copyable={copyable} /> : "-"}
      </span>
    </div>
  );
}
