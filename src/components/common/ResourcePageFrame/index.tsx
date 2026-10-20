import { Space, Tooltip } from "@arco-design/web-react";
import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import styles from "./index.module.css";

type ResourcePageHeaderActionButtonProps = { action: ResourcePageHeaderAction };

type ResourcePageTitleProps = {
  iconClassName: string;
  title: string;
  subtitle?: string;
};

type ResourcePageHeaderAction = {
  key: string;
  label: ReactNode;
  iconClassName?: string;
  variant?: "primary" | "outline" | "secondary" | "danger";
  tooltip?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "disabled" | "onClick">;
};

type ResourcePageHeaderBaseConfig = ResourcePageTitleProps;

export type ResourcePageHeaderConfig = ResourcePageHeaderBaseConfig &
  (
    | {
        actions?: ResourcePageHeaderAction[];
        extra?: never;
      }
    | {
        actions?: never;
        extra: ReactNode;
      }
  );

type ResourcePageHeaderProps = ResourcePageHeaderConfig;

type ResourcePageFrameProps = {
  header: ResourcePageHeaderConfig;
  children: ReactNode;
};

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconClassName?: string;
  variant?: "primary" | "outline" | "secondary" | "danger";
};

const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
  { iconClassName, variant = "outline", className = "", children, ...buttonProps },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(styles.toolbarButton, styles[`toolbarButton_${variant}`], className)}
      {...buttonProps}
    >
      {iconClassName ? <i className={clsx("iconfont", iconClassName)} aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

function ResourcePageTitle({ iconClassName, title, subtitle }: ResourcePageTitleProps) {
  return (
    <>
      <div className={styles.pageHeaderIcon} aria-hidden="true">
        <i className={clsx("iconfont", iconClassName)} />
      </div>
      <div className={styles.pageHeaderTitleArea}>
        <h1 className={styles.pageHeaderTitle}>{title}</h1>
        {subtitle ? <p className={styles.pageHeaderSubtitle}>{subtitle}</p> : null}
      </div>
    </>
  );
}

function ResourcePageHeaderActionButton({ action }: ResourcePageHeaderActionButtonProps) {
  const button = (
    <ToolbarButton
      {...action.buttonProps}
      iconClassName={action.iconClassName}
      variant={action.variant}
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {action.label}
    </ToolbarButton>
  );

  if (!action.tooltip) return button;

  return (
    <Tooltip content={action.tooltip}>
      <span>{button}</span>
    </Tooltip>
  );
}

function ResourcePageHeader({
  iconClassName,
  title,
  subtitle,
  actions,
  extra,
}: ResourcePageHeaderProps) {
  const actionArea = actions?.length ? (
    <Space size={8}>
      {actions.map((action) => (
        <ResourcePageHeaderActionButton key={action.key} action={action} />
      ))}
    </Space>
  ) : (
    extra
  );

  return (
    <header className={styles.pageHeader}>
      <ResourcePageTitle iconClassName={iconClassName} title={title} subtitle={subtitle} />
      {actionArea ? <div className={styles.pageHeaderExtra}>{actionArea}</div> : null}
    </header>
  );
}

export default function ResourcePageFrame({ header, children }: ResourcePageFrameProps) {
  return (
    <div className={styles.page}>
      <ResourcePageHeader {...header} />
      {children}
    </div>
  );
}
