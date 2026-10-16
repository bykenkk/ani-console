import { useCursorPaginatedQuery } from "@/hooks/useCursorPaginatedQuery";
import { listInstances } from "@/api/instances";
import { DataTable, StatusBadge, type ListColumn } from "@/components/common";
import { withId } from "@/lib/id";
import { Tag } from "@arco-design/web-react";

type RelatedResource = { id: string; kind: "实例"; name: string; status: string };

export default function SubnetRelatedResources({ subnetId }: { subnetId: string }) {
  const {
    query: instances,
    items,
    pagination,
  } = useCursorPaginatedQuery({
    queryKey: ["instances", "subnet", subnetId],
    queryFn: (params) => listInstances({ ...params, subnet_id: subnetId }),
    errorNotification: {
      id: withId("subnet-instances", subnetId),
      action: "关联实例加载",
      fallback: "请求失败，请稍后重试",
    },
  });
  const resources: RelatedResource[] = items.map((item) => ({
    id: item.id,
    kind: "实例",
    name: item.name,
    status: item.state,
  }));
  const columns: Array<ListColumn<RelatedResource>> = [
    { title: "类型", width: 120, render: (_, item) => <Tag>{item.kind}</Tag> },
    { title: "名称", dataIndex: "name" },
    { title: "资源 ID", dataIndex: "id" },
    { title: "状态", width: 120, render: (_, item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <section>
      <DataTable<RelatedResource>
        header={{
          title: "关联资源",
        }}
        columns={columns}
        data={resources}
        loading={instances.isLoading}
        pagination={pagination}
        tableLabel="子网关联资源"
      />
    </section>
  );
}
