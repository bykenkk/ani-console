import type { TableColumnProps, TableProps } from "@arco-design/web-react";
import {
  ACTION_BUTTON_BORDER_WIDTH,
  ACTION_BUTTON_HORIZONTAL_PADDING,
  CELL_HORIZONTAL_PADDING,
  DEFAULT_COLUMN_WIDTH,
  MORE_ICON_WIDTH,
} from "./constants";
import type { RowAction } from "./RowActions";

export function unavailableAction<T>(key: string, label: string): RowAction<T> {
  return {
    key,
    label,
    disabled: () => true,
    title: "该操作暂未开放",
    onClick: () => undefined,
  };
}

function getTextWidth(text: string) {
  return Array.from(text).reduce(
    (width, character) => width + ((character.codePointAt(0) ?? 0) <= 0xff ? 9 : 14),
    0,
  );
}

function getColumnWidth<T>(column: TableColumnProps<T>) {
  if (typeof column.width === "number") return column.width;
  return DEFAULT_COLUMN_WIDTH;
}

export function getRowActionsColumnWidth() {
  return (
    MORE_ICON_WIDTH +
    ACTION_BUTTON_HORIZONTAL_PADDING +
    ACTION_BUTTON_BORDER_WIDTH * 2 +
    CELL_HORIZONTAL_PADDING
  );
}

export function normalizeDataTableColumns<T>(columns: Array<TableColumnProps<T>>) {
  return columns.map((column) => {
    if (typeof column.title !== "string") return column;
    const headerMinWidth = getTextWidth(column.title) + CELL_HORIZONTAL_PADDING;
    return {
      ...column,
      headerCellStyle: { minWidth: headerMinWidth, ...column.headerCellStyle },
      bodyCellStyle: { minWidth: headerMinWidth, ...column.bodyCellStyle },
      onHeaderCell: (currentColumn: typeof column, index: number) => ({
        title: column.title,
        ...column.onHeaderCell?.(currentColumn, index),
      }),
    };
  });
}

export function resolveDataTableScroll<T>(
  columns: Array<TableColumnProps<T>>,
  scroll: TableProps<T>["scroll"],
) {
  const calculatedScrollX = columns.reduce((width, column) => width + getColumnWidth(column), 0);
  return {
    ...scroll,
    x:
      scroll?.x === false
        ? false
        : typeof scroll?.x === "number"
          ? Math.max(scroll.x, calculatedScrollX)
          : (scroll?.x ?? calculatedScrollX),
  };
}
