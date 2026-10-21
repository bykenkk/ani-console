import { Empty } from "@arco-design/web-react";
import clsx from "clsx";
import { DataTable, type DataTableProps } from "../DataTable";
import styles from "./index.module.css";

export type ListDataTableProps<T> = Omit<DataTableProps<T>, "noDataElement"> & {
  emptyText?: string;
};

export default function ListDataTable<T>({
  className,
  emptyText = "暂无数据",
  scroll,
  ...tableProps
}: ListDataTableProps<T>) {
  return (
    <DataTable
      {...tableProps}
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
