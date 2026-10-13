import { Empty } from "@arco-design/web-react";
import clsx from "clsx";
import { DataTable, type DataTableProps } from "../DataTable";
import styles from "./index.module.css";

export type ListDataTableProps<T> = Omit<DataTableProps<T>, "noDataElement"> & {
  emptyText?: string;
};

const DEFAULT_NAME_COLUMN_WIDTH = 200;

export default function ListDataTable<T>({
  className,
  emptyText = "暂无数据",
  scroll,
  ...tableProps
}: ListDataTableProps<T>) {
  const columns = tableProps.columns.map((column) => {
    const fixedColumn =
      column.key === "name"
        ? {
            ...column,
            fixed: column.fixed ?? ("left" as const),
            width: column.width ?? DEFAULT_NAME_COLUMN_WIDTH,
          }
        : column;
    return fixedColumn;
  });
  return (
    <DataTable
      {...tableProps}
      columns={columns}
      className={clsx(
        styles.listDataTable,
        { [styles.empty]: tableProps.data.length === 0 },
        className,
      )}
      scroll={{ ...scroll, y: scroll?.y ?? true }}
      noDataElement={<Empty description={emptyText} />}
    />
  );
}
