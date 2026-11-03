import clsx from "clsx";
import type { ReactNode } from "react";
import { Button, Dropdown, Menu, Tooltip } from "@arco-design/web-react";
import { IconMoreVertical } from "@arco-design/web-react/icon";
import {
  ACTION_BUTTON_BORDER_WIDTH,
  ACTION_BUTTON_HORIZONTAL_PADDING,
  MORE_ICON_WIDTH,
} from "../constants";

type ConfiguredDataTableRowActionsProps<T> = {
  actions: Array<RowAction<T>>;
  record: T;
};

type RowActionIntent = "default" | "danger" | "warning" | "success";

type ActionValue<T, V> = V | ((record: T) => V);

export type RowAction<T> = {
  key: string;
  label: ActionValue<T, string>;
  intent?: RowActionIntent;
  visible?: (record: T) => boolean;
  disabled?: (record: T) => boolean;
  loading?: (record: T) => boolean;
  title?: ActionValue<T, string | undefined>;
  tooltip?: ActionValue<T, string | undefined>;
  onClick: (record: T) => void | Promise<unknown>;
};

function resolveActionValue<T, V>(value: V | ((record: T) => V), record: T): V {
  return typeof value === "function" ? (value as (current: T) => V)(record) : value;
}

function renderActionLabel<T>(action: RowAction<T>, record: T) {
  return resolveActionValue(action.label, record);
}

function renderTooltip<T>(action: RowAction<T>, record: T, node: ReactNode) {
  const content = action.tooltip ? resolveActionValue(action.tooltip, record) : undefined;
  return content ? (
    <Tooltip content={content}>
      <span className="inline-flex">{node}</span>
    </Tooltip>
  ) : (
    node
  );
}

export function ConfiguredDataTableRowActions<T>({
  actions,
  record,
}: ConfiguredDataTableRowActionsProps<T>) {
  const visibleActions = actions.filter((action) => action.visible?.(record) !== false);
  const menu = visibleActions.length ? (
    <Menu
      onClickMenuItem={(key) => {
        const action = visibleActions.find((item) => item.key === key);
        if (action) action.onClick(record);
      }}
    >
      {visibleActions.map((action) => {
        const disabled = action.disabled?.(record) || action.loading?.(record);
        return (
          <Menu.Item
            key={action.key}
            disabled={disabled}
            title={resolveActionValue(action.title, record)}
            className={clsx(
              !disabled && {
                "text-app-danger!": action.intent === "danger",
                "text-[rgb(var(--warning-6))]!": action.intent === "warning",
                "text-[rgb(var(--success-6))]!": action.intent === "success",
              },
            )}
          >
            {renderTooltip(action, record, renderActionLabel(action, record))}
          </Menu.Item>
        );
      })}
    </Menu>
  ) : null;

  if (!menu) return "-";

  return (
    <Dropdown droplist={menu} trigger="click" position="br">
      <Button
        type="text"
        size="small"
        aria-label="更多操作"
        title="更多操作"
        style={{
          paddingInline: ACTION_BUTTON_HORIZONTAL_PADDING / 2,
          borderWidth: ACTION_BUTTON_BORDER_WIDTH,
        }}
      >
        <IconMoreVertical style={{ width: MORE_ICON_WIDTH, height: MORE_ICON_WIDTH }} />
      </Button>
    </Dropdown>
  );
}
