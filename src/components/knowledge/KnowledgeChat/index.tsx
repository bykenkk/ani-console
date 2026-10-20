import { listInferenceServices } from "@/api/inference";
import {
  deleteKnowledgeBaseSession,
  listKnowledgeBaseCitations,
  listKnowledgeBaseSessionMessages,
  listKnowledgeBaseSessions,
  type KBSession as Session,
} from "@/api/knowledge";
import { withId } from "@/lib/id";
import { Spin } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import KnowledgeCitationsDrawer from "./KnowledgeCitationsDrawer";
import KnowledgeConversation from "./KnowledgeConversation";
import KnowledgeSessionsSidebar from "./KnowledgeSessionsSidebar";
import { toThreadMessage, type QueryMode } from "./knowledgeQueryAdapter";

export default function KnowledgeChat({
  kbId,
  defaultTopK = 5,
  defaultInferenceService,
}: {
  kbId: string;
  defaultTopK?: number;
  defaultInferenceService?: string;
}) {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string>();
  const [draftVersion, setDraftVersion] = useState(0);
  const [mode, setMode] = useState<QueryMode>("sync");
  const [topK, setTopK] = useState(defaultTopK);
  const [inferenceServiceName, setInferenceServiceName] = useState<string>();
  const [citationsVisible, setCitationsVisible] = useState(false);
  const inferenceModels = useQuery({
    meta: {
      errorNotification: {
        id: withId("inference-models", "text-generation"),
        action: "推理模型列表加载",
        fallback: "将使用知识库或平台默认模型",
      },
    },
    queryKey: ["inference-services", "model-options", "text-generation", "running"],
    queryFn: ({ signal }) =>
      listInferenceServices({ capability: "text-generation", status: "running" }, signal),
  });
  const inferenceModelOptions = useMemo(
    () =>
      (inferenceModels.data?.items ?? []).map((service) => ({
        value: service.served_model_name,
        label: service.served_model_name,
      })),
    [inferenceModels.data?.items],
  );
  useEffect(() => {
    if (
      inferenceServiceName &&
      inferenceModels.data &&
      !inferenceModelOptions.some((option) => option.value === inferenceServiceName)
    ) {
      setInferenceServiceName(undefined);
    }
  }, [inferenceModelOptions, inferenceModels.data, inferenceServiceName]);
  const sessions = useQuery({
    meta: {
      errorNotification: {
        id: withId("knowledge-sessions", kbId),
        action: "会话列表加载",
      },
    },
    queryKey: ["knowledge-base-sessions", kbId],
    queryFn: async () => (await listKnowledgeBaseSessions(kbId)).items,
  });
  const messages = useQuery({
    meta: {
      errorNotification: {
        id: withId("knowledge-messages", kbId, activeSessionId ?? "none"),
        action: "会话消息加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["knowledge-base-session-messages", kbId, activeSessionId],
    enabled: Boolean(activeSessionId),
    queryFn: async () => (await listKnowledgeBaseSessionMessages(kbId, activeSessionId!)).items,
  });
  const citations = useQuery({
    meta: {
      errorNotification: {
        id: withId("knowledge-citations", kbId),
        action: "引用记录加载",
      },
    },
    queryKey: ["knowledge-base-citations", kbId],
    enabled: citationsVisible,
    queryFn: () => listKnowledgeBaseCitations(kbId),
  });
  const initialMessages = useMemo(
    () => (messages.data ?? []).map(toThreadMessage),
    [messages.data],
  );
  const deleteSession = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "knowledge-session-delete",
        action: "删除会话",
        successText: "会话已删除",
        errorFallback: "删除会话失败",
      },
    },
    mutationFn: (session: Session) => deleteKnowledgeBaseSession(kbId, session.id),
    onSuccess: (_, session) => {
      if (activeSessionId === session.id) {
        setActiveSessionId(undefined);
        setDraftVersion((current) => current + 1);
      }
      qc.invalidateQueries({ queryKey: ["knowledge-base-sessions", kbId] });
      qc.invalidateQueries({ queryKey: ["knowledge-base-citations", kbId] });
    },
  });

  const addSession = () => {
    setActiveSessionId(undefined);
    setDraftVersion((current) => current + 1);
    setCitationsVisible(false);
  };
  const handleComplete = useCallback(
    (sessionId?: string) => {
      qc.invalidateQueries({ queryKey: ["knowledge-base-sessions", kbId] });
      qc.invalidateQueries({ queryKey: ["knowledge-base-citations", kbId] });
      if (sessionId) {
        qc.invalidateQueries({
          queryKey: ["knowledge-base-session-messages", kbId, sessionId],
        });
        if (sessionId !== activeSessionId) setActiveSessionId(sessionId);
      }
    },
    [activeSessionId, kbId, qc],
  );
  const sessionKey = activeSessionId ?? `draft-${draftVersion}`;

  return (
    <>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden [@media(max-width:1024px)]:h-155">
        <div className="flex min-h-0 min-w-0 flex-auto overflow-hidden rounded-lg border border-solid border-app-border-strong bg-app-surface">
          <KnowledgeSessionsSidebar
            sessions={sessions.data}
            loading={sessions.isLoading}
            error={sessions.error}
            activeSessionId={activeSessionId}
            deletingSessionId={deleteSession.isPending ? deleteSession.variables?.id : undefined}
            onNew={addSession}
            onSelect={(sessionId) => {
              setActiveSessionId(sessionId);
              setCitationsVisible(false);
            }}
            onDelete={(session) => deleteSession.mutateAsync(session)}
            onViewCitations={() => setCitationsVisible(true)}
          />
          <div className="flex min-h-0 min-w-0 flex-auto flex-col overflow-hidden">
            {activeSessionId && messages.isLoading ? (
              <div className="flex min-h-80 flex-auto flex-col items-center justify-center gap-3 p-6">
                <Spin />
              </div>
            ) : activeSessionId && messages.error ? (
              <div className="flex min-h-80 flex-auto flex-col items-center justify-center gap-3 p-6" />
            ) : (
              <KnowledgeConversation
                key={sessionKey}
                kbId={kbId}
                sessionId={activeSessionId}
                initialMessages={initialMessages}
                mode={mode}
                topK={topK}
                onModeChange={setMode}
                onTopKChange={setTopK}
                inferenceServiceName={inferenceServiceName}
                inferenceModelOptions={inferenceModelOptions}
                inferenceModelsLoading={inferenceModels.isLoading}
                defaultInferenceService={defaultInferenceService}
                onInferenceServiceChange={setInferenceServiceName}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>
      </div>
      <KnowledgeCitationsDrawer
        visible={citationsVisible}
        citations={citations.data?.items}
        loading={citations.isLoading}
        error={citations.error}
        onCancel={() => setCitationsVisible(false)}
        onSelectSession={(sessionId) => {
          setActiveSessionId(sessionId);
          setCitationsVisible(false);
        }}
      />
    </>
  );
}
