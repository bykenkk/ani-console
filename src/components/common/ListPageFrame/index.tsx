import ResourcePageFrame, { type ResourcePageHeaderConfig } from "../ResourcePageFrame";
import { ListToolbar, ToolbarIconButton, ToolbarSearch, type SearchField } from "./ListToolbar";
import StatusTabs, { type ListStatusTab } from "./StatusTabs";

import styles from "./index.module.css";
import type { ReactNode } from "react";

type ListPageTabsConfig<TStatus extends string> = {
  items: Array<ListStatusTab<TStatus>>;
  value: TStatus;
  onChange: (value: TStatus) => void;
  ariaLabel?: string;
};

type ListPageSearchConfig<TSearchField extends string> = {
  disabled?: boolean;
  fields: Array<SearchField<TSearchField>>;
  field: TSearchField;
  value: string;
  placeholder?: string;
  onFieldChange: (field: TSearchField) => void;
  onChange: (value: string) => void;
};

type ListPageRefreshConfig = {
  onClick: () => void;
  spinning?: boolean;
  disabled?: boolean;
  label?: string;
};

type ListPageToolbarConfig<TSearchField extends string> = {
  actions?: ReactNode;
  search?: ListPageSearchConfig<TSearchField>;
  filters?: ReactNode;
  refresh?: ListPageRefreshConfig;
  tools?: ReactNode;
};

type ListPageFrameProps<TStatus extends string = string, TSearchField extends string = string> = {
  header: ResourcePageHeaderConfig;
  tabs?: ListPageTabsConfig<TStatus>;
  toolbar?: ListPageToolbarConfig<TSearchField>;
  children: ReactNode;
};

export default function ListPageFrame<
  TStatus extends string = string,
  TSearchField extends string = string,
>({ header, tabs, toolbar, children }: ListPageFrameProps<TStatus, TSearchField>) {
  const toolbarFilters =
    toolbar?.search || toolbar?.filters ? (
      <>
        {toolbar.search ? <ToolbarSearch {...toolbar.search} /> : null}
        {toolbar.filters}
      </>
    ) : undefined;
  const toolbarTools =
    toolbar?.tools || toolbar?.refresh ? (
      <>
        {toolbar.tools}
        {toolbar.refresh ? (
          <ToolbarIconButton
            iconClassName="icon-refresh-1"
            label={toolbar.refresh.label ?? "刷新"}
            spinning={toolbar.refresh.spinning}
            disabled={toolbar.refresh.disabled}
            onClick={toolbar.refresh.onClick}
          />
        ) : null}
      </>
    ) : undefined;

  return (
    <ResourcePageFrame header={header}>
      <section className={styles.contentPanel}>
        {tabs ? <StatusTabs {...tabs} /> : null}
        {toolbar ? (
          <ListToolbar actions={toolbar.actions} filters={toolbarFilters} tools={toolbarTools} />
        ) : null}
        {children}
      </section>
    </ResourcePageFrame>
  );
}
