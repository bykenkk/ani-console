import { withId } from "@/lib/id";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@arco-design/web-react";
import { listKnowledgeBaseAuditLogs, type KBAuditLog } from "@/api/knowledge";
import { DataTable, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  "kb.create": "创建知识库",
  "kb.update": "更新知识库",
  "kb.delete": "删除知识库",
  "kb.permissions.update": "更新权限",
  "kb.config.update": "更新配置",
  "kb.rebuild": "重建知识库",
  "kb.query": "查询知识库",
  "doc.create": "上传文档",
  "doc.parse": "解析文档",
  "doc.delete": "删除文档",
  "doc.reparse": "重新解析文档",
  "session.delete": "删除会话",
};

export default function KnowledgeBaseAuditLogs({ kbId }: { kbId: string }) {
  const logs = useInfiniteQuery({
    meta: {
      errorNotification: {
        id: withId("knowledge-audit", kbId),
        action: "操作记录加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["knowledge-base-audit-logs", kbId],
    initialPageParam: "0",
    queryFn: ({ pageParam }) =>
      listKnowledgeBaseAuditLogs(kbId, {
        limit: PAGE_SIZE,
        cursor: pageParam === "0" ? undefined : pageParam,
      }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.next_cursor ? String(pages.length * PAGE_SIZE) : undefined,
  });
  const items = logs.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      <DataTable<KBAuditLog>
        header={{
          title: "操作记录",
          extra: (
            <Button
              size="small"
              loading={logs.isFetching && !logs.isFetchingNextPage}
              onClick={() => {
                logs.refetch();
              }}
            >
              刷新
            </Button>
          ),
        }}
        data={items}
        loading={logs.isPending}
        pagination={false}
        tableLabel="知识库操作记录列表"
        columns={[
          {
            title: "操作时间",
            width: 180,
            render: (_, log) => formatDateTime(log.created_at),
          },
          {
            title: "操作",
            width: 160,
            render: (_, log) => ACTION_LABELS[log.action] ?? log.action,
          },
          {
            title: "操作者",
            dataIndex: "actor_user_id",
            placeholder: "系统",
            width: 240,
            ellipsis: true,
          },
          {
            title: "结果",
            width: 100,
            render: (_, log) => (
              <StatusBadge status={log.error_code ? "failed" : "succeeded"}>
                {log.error_code ? "失败" : "成功"}
              </StatusBadge>
            ),
          },
        ]}
      />

      {logs.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button
            loading={logs.isFetchingNextPage}
            disabled={logs.isFetching}
            onClick={() => {
              logs.fetchNextPage();
            }}
          >
            加载更多
          </Button>
        </div>
      ) : null}
    </div>
  );
}
