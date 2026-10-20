import { Tooltip } from "@arco-design/web-react";
import clsx from "clsx";
import {
  getImageDisplayName,
  getImageSelectionLabel,
  getImageTooltip,
  type ImageDisplaySource,
} from "@/lib/render";

type ImageNameTextProps = {
  image?: ImageDisplaySource | string | null;
  showSize?: boolean;
  className?: string;
};

export default function ImageNameText({ image, showSize = false, className }: ImageNameTextProps) {
  const label = showSize ? getImageSelectionLabel(image) : getImageDisplayName(image);

  return (
    <Tooltip content={getImageTooltip(image)}>
      <span className={clsx("block truncate", className)}>{label}</span>
    </Tooltip>
  );
}
