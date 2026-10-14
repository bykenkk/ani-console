/// <reference types="vite/client" />
/// <reference types="novnc__novnc" />

import "@tanstack/react-query";

export type QueryErrorNotificationMeta = {
  id: string;
  action: string;
  fallback?: string;
};

type MutationFeedbackBase = {
  action: string;
  successText?: string;
  errorFallback?: string;
};

export type MutationFeedbackMeta =
  | (MutationFeedbackBase & {
      channel: "message";
    })
  | (MutationFeedbackBase & {
      channel: "notification";
      id: string;
      successDescription?: string;
    });

export type MutationFeedback =
  | MutationFeedbackMeta
  | ((variables: unknown) => MutationFeedbackMeta);

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_PROXY_TARGET?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      errorNotification?: QueryErrorNotificationMeta;
    };
    mutationMeta: {
      feedback?: MutationFeedback;
    };
  }
}

declare module "@arco-design/web-react/dist/css/arco.css";
