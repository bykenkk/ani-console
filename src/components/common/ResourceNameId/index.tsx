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
  const detailTarget = openable && props.type && id ? { type: props.type, id } : undefined;

  const handleOpen = () => {
    if (!detailTarget) return;
    navigateToResourceDetail(navigate, detailTarget);
  };

  return (
    <div className="flex w-0 min-w-full flex-col gap-0.5">
      <span className="block max-w-full truncate text-[14px] leading-5 text-app-text" title={name}>
        {detailTarget ? (
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
        <ResourceId value={id} copyable={copyable} />
      </span>
    </div>
  );
}
