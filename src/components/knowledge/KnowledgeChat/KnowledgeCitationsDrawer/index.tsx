import { Button, Drawer, Empty, Spin, Typography } from "@arco-design/web-react";
import type { KBCitation as Citation } from "@/api/knowledge";
import { formatDateTime } from "@/lib/format";

export default function KnowledgeCitationsDrawer({
  visible,
  citations,
  loading,
  error,
  onCancel,
  onSelectSession,
}: {
  visible: boolean;
  citations?: Citation[];
  loading: boolean;
  error: unknown;
  onCancel: () => void;
  onSelectSession: (sessionId: string) => void;
}) {
  return (
    <Drawer width={560} title="本库全部引用" visible={visible} footer={null} onCancel={onCancel}>
      {loading ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2">
          <Spin />
        </div>
      ) : error ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2" />
      ) : citations?.length ? (
        <div className="flex flex-col gap-3">
          {citations.map((citation) => (
            <article
              key={citation.id}
              className="rounded-lg border border-solid border-app-border-strong bg-app-surface p-3.5"
            >
              <div className="mb-2 flex flex-col gap-0.75">
                <Typography.Text bold>{citation.file_name}</Typography.Text>
                <Typography.Text type="secondary">
                  {citation.page ? `第 ${citation.page} 页 · ` : ""}
                  {citation.score == null ? "" : `匹配度 ${citation.score.toFixed(3)} · `}
                  {formatDateTime(citation.created_at)}
                </Typography.Text>
              </div>
              <Typography.Paragraph className="mb-0!" type="secondary">
                {citation.content}
              </Typography.Paragraph>
              {citation.session_id ? (
                <Button
                  type="text"
                  size="small"
                  onClick={() => onSelectSession(citation.session_id!)}
                >
                  打开所属会话
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <Empty description="暂无引用记录" />
      )}
    </Drawer>
  );
}
