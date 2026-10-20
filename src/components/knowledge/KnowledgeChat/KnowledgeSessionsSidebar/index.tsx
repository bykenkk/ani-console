import { Button, Empty, Modal, Spin } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import clsx from "clsx";
import type { KBSession as Session } from "@/api/knowledge";
import { formatDateTime } from "@/lib/format";
import styles from "./index.module.css";

type KnowledgeSessionsSidebarProps = {
  sessions?: Session[];
  loading: boolean;
  error: unknown;
  activeSessionId?: string;
  deletingSessionId?: string;
  onNew: () => void;
  onSelect: (sessionId: string) => void;
  onDelete: (session: Session) => Promise<void>;
  onViewCitations: () => void;
};

export default function KnowledgeSessionsSidebar({
  sessions,
  loading,
  error,
  activeSessionId,
  deletingSessionId,
  onNew,
  onSelect,
  onDelete,
  onViewCitations,
}: KnowledgeSessionsSidebarProps) {
  return (
    <aside
      className="box-border flex min-h-0 w-55 min-w-46 flex-[0_1_220px] flex-col gap-3 bg-app-fill p-3.5 [border-right:1px_solid_var(--color-border-1)] [@media(max-width:1024px)]:w-46 [@media(max-width:1024px)]:basis-46"
      aria-label="问答会话"
    >
      <Button type="primary" long icon={<IconPlus />} onClick={onNew}>
        新会话
      </Button>
      <div className="flex min-h-0 flex-auto flex-col gap-1.5 overflow-y-auto">
        {!activeSessionId ? (
          <button
            type="button"
            className="flex w-full shrink-0 cursor-pointer flex-col gap-1 overflow-hidden! rounded-md border border-solid py-2.5 text-left hover:bg-app-fill-secondary px-3 border-(--color-primary-light-3) bg-(--color-primary-light-1) text-(--color-primary-6)"
            onClick={onNew}
          >
            <span className="truncate font-medium">新会话</span>
            <span className="truncate text-[12px] text-app-text-tertiary">尚未提问</span>
          </button>
        ) : null}
        {loading ? (
          <div className="flex min-h-20 flex-col items-center justify-center gap-2">
            <Spin size={18} />
          </div>
        ) : error ? (
          <div className="flex min-h-20 flex-col items-center justify-center gap-2" />
        ) : sessions?.length ? (
          sessions.map((session) => (
            <div key={session.id} className={styles.row}>
              <button
                type="button"
                className={clsx(
                  "flex w-full shrink-0 cursor-pointer flex-col gap-1 overflow-hidden! rounded-md border border-solid py-2.5 text-left hover:bg-app-fill-secondary pr-12 pl-3",
                  session.id === activeSessionId
                    ? "border-(--color-primary-light-3) bg-(--color-primary-light-1) text-(--color-primary-6)"
                    : "border-transparent bg-transparent text-app-text-secondary",
                )}
                onClick={() => onSelect(session.id)}
              >
                <span className="truncate font-medium">{session.last_query || "新会话"}</span>
                <span className="truncate text-[12px] text-app-text-tertiary">
                  {session.message_count ?? 0} 条消息 ·{" "}
                  {formatDateTime(session.last_active_at || session.created_at)}
                </span>
              </button>
              <Button
                type="text"
                size="mini"
                status="danger"
                className={styles.delete}
                aria-label={`删除会话：${session.last_query || session.id}`}
                loading={deletingSessionId === session.id}
                onClick={() =>
                  Modal.confirm({
                    title: "删除会话",
                    content: `确定删除会话「${session.last_query || session.id}」？`,
                    okButtonProps: { status: "danger" },
                    onOk: () => onDelete(session),
                  })
                }
              >
                删除
              </Button>
            </div>
          ))
        ) : (
          <Empty description="暂无历史会话" />
        )}
      </div>
      <Button type="text" long onClick={onViewCitations}>
        查看本库全部引用
      </Button>
    </aside>
  );
}
