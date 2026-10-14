import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { closeNotification, showMessage, showNotification } from "@/lib/feedback";
import type { MutationFeedback } from "@/vite-env";

function resolveFeedback(feedback: MutationFeedback | undefined, variables: unknown) {
  return typeof feedback === "function" ? feedback(variables) : feedback;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const feedback = query.meta?.errorNotification;
      if (!feedback) return;
      showNotification({
        id: feedback.id,
        state: "error",
        action: feedback.action,
        content: { error, fallback: feedback.fallback ?? `${feedback.action}失败` },
      });
    },
    onSuccess: (_data, query) => {
      const id = query.meta?.errorNotification?.id;
      if (id) closeNotification(id);
    },
  }),
  mutationCache: new MutationCache({
    onMutate: (_variables, mutation) => {
      const feedback = resolveFeedback(mutation.meta?.feedback, _variables);
      if (feedback?.channel !== "notification") return;
      showNotification({
        id: feedback.id,
        state: "loading",
        action: feedback.action,
      });
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const feedback = resolveFeedback(mutation.meta?.feedback, _variables);
      if (!feedback) return;
      if (feedback.channel === "message") {
        showMessage({
          type: "success",
          content: feedback.successText ?? `${feedback.action}成功`,
        });
        return;
      }
      showNotification({
        id: feedback.id,
        state: "success",
        action: feedback.action,
        title: feedback.successText,
        content: feedback.successDescription,
      });
    },
    onError: (error, _variables, _context, mutation) => {
      const feedback = resolveFeedback(mutation.meta?.feedback, _variables);
      if (!feedback) return;
      const content = {
        error,
        fallback: feedback.errorFallback ?? `${feedback.action}失败`,
      };
      if (feedback.channel === "message") {
        showMessage({ type: "error", content });
        return;
      }
      showNotification({
        id: feedback.id,
        state: "error",
        action: feedback.action,
        content,
      });
    },
  }),
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});
