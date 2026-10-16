import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { parseTokenExpiresIn, type TokenExpiresIn } from "@/api/auth/token";
import { useAuthStore } from "@/stores/auth";

export const CORE_API_BASE = "/api/v1";
export const SERVICES_API_BASE = "/api/v1/svc";
export const ADMIN_API_BASE = "/api/v1/admin";

export type ApiAuthMode = "required" | "public";

export interface ApiRequestOptions<TBody = unknown> extends Omit<
  AxiosRequestConfig<TBody>,
  "auth" | "baseURL" | "data" | "params" | "url"
> {
  auth?: ApiAuthMode;
  data?: TBody;
  params?: object;
}

type AniRequestConfig<TBody = unknown> = InternalAxiosRequestConfig<TBody> & {
  aniAuth?: ApiAuthMode;
  aniRetried?: boolean;
};

type RefreshAccessTokenResponse = {
  access_token: string;
  expires_in?: TokenExpiresIn;
  issued_at?: string;
};

type ApiErrorPayload = {
  error?: unknown;
  code?: unknown;
  reason?: unknown;
  message?: unknown;
  request_id?: unknown;
  metadata?: unknown;
  details?: unknown;
  detail?: unknown;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly request_id?: string;
  readonly details?: Record<string, unknown>;
  readonly config?: AxiosRequestConfig;
  readonly response?: AxiosResponse<unknown>;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      requestId?: string;
      details?: Record<string, unknown>;
      config?: AxiosRequestConfig;
      response?: AxiosResponse<unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.request_id = options.requestId;
    this.details = options.details;
    this.config = options.config;
    this.response = options.response;
  }
}

function serializeParams(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value !== null && value !== undefined) query.append(key, String(value));
    }
  }
  return query.toString();
}

function createApiInstance(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    withCredentials: true,
    paramsSerializer: { serialize: serializeParams },
  });
}

const coreAxios = createApiInstance(CORE_API_BASE);
const servicesAxios = createApiInstance(SERVICES_API_BASE);
const adminAxios = createApiInstance(ADMIN_API_BASE);
const refreshAxios = createApiInstance(CORE_API_BASE);
refreshAxios.defaults.timeout = 15_000;

export const AUTH_APPLICATION = "console" as const;
let csrfToken: string | undefined;
let csrfRequest: Promise<string> | undefined;
let refreshRequest: Promise<string> | undefined;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let refreshDueAt: number | undefined;
let loggingOut = false;
let sessionGeneration = 0;

function expireAuthSession(): void {
  useAuthStore.getState().clear();
}

function payloadRecord(value: unknown): ApiErrorPayload | undefined {
  return value && typeof value === "object" ? (value as ApiErrorPayload) : undefined;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError(error instanceof Error ? error.message : "请求失败", { cause: error });
  }

  const responsePayload = payloadRecord(error.response?.data);
  const payload = payloadRecord(responsePayload?.error) ?? responsePayload;
  const metadata = payloadRecord(payload?.metadata) ?? payloadRecord(responsePayload?.metadata);
  const message =
    (typeof payload?.message === "string" && payload.message) ||
    (typeof payload?.detail === "string" && payload.detail) ||
    error.message ||
    (error.response ? `HTTP ${error.response.status}` : "网络请求失败");
  const requestId =
    (typeof payload?.request_id === "string" && payload.request_id) ||
    (typeof metadata?.request_id === "string" && metadata.request_id) ||
    undefined;
  const details =
    payload?.details && typeof payload.details === "object"
      ? (payload.details as Record<string, unknown>)
      : undefined;

  return new ApiError(message, {
    status: error.response?.status,
    code:
      (typeof payload?.code === "string" && payload.code) ||
      (typeof payload?.reason === "string" && payload.reason) ||
      error.code,
    requestId,
    details,
    config: error.config,
    response: error.response,
    cause: error,
  });
}

export async function initializeCsrfToken(): Promise<string> {
  csrfToken = undefined;
  return getCsrfToken();
}

function getCsrfToken(): Promise<string> {
  if (csrfToken) return Promise.resolve(csrfToken);
  if (csrfRequest) return csrfRequest;
  const generation = sessionGeneration;
  const promise = refreshAxios
    .post<{ csrf_token: string }>("/auth/csrf", { application: AUTH_APPLICATION })
    .then(({ data }) => {
      if (!data?.csrf_token) throw new ApiError("认证响应缺少 csrf_token");
      if (generation !== sessionGeneration) throw new ApiError("登录会话已变更");
      csrfToken = data.csrf_token;
      return csrfToken;
    })
    .catch((error: unknown) => {
      throw toApiError(error);
    })
    .finally(() => {
      if (csrfRequest === promise) csrfRequest = undefined;
    });
  csrfRequest = promise;
  return promise;
}

async function requestTokenRefresh(): Promise<RefreshAccessTokenResponse> {
  try {
    const send = async () =>
      refreshAxios.post<RefreshAccessTokenResponse>(
        "/auth/refresh",
        { application: AUTH_APPLICATION },
        { headers: { "X-CSRF-Token": await getCsrfToken() } },
      );
    let response;
    try {
      response = await send();
    } catch (error) {
      if (toApiError(error).status !== 403) throw error;
      csrfToken = undefined;
      response = await send();
    }
    if (!response.data?.access_token) {
      throw new ApiError("刷新令牌响应缺少 access_token", { response });
    }
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

function refreshAccessToken(): Promise<string> {
  if (loggingOut) return Promise.reject(new ApiError("正在退出登录"));
  if (refreshRequest) return refreshRequest;
  const generation = sessionGeneration;
  const promise = requestTokenRefresh()
    .then((refreshed) => {
      if (loggingOut || generation !== sessionGeneration) throw new ApiError("登录会话已变更");
      const authState = useAuthStore.getState();
      authState.setAuthSession({
        access_token: refreshed.access_token,
        expires_in: parseTokenExpiresIn(refreshed.expires_in),
        issued_at: refreshed.issued_at,
      });
      return refreshed.access_token;
    })
    .catch((error: unknown) => {
      const apiError = toApiError(error);
      if (
        !loggingOut &&
        generation === sessionGeneration &&
        (apiError.status === 401 || apiError.status === 403)
      )
        expireAuthSession();
      throw apiError;
    })
    .finally(() => {
      if (refreshRequest === promise) refreshRequest = undefined;
    });
  refreshRequest = promise;
  return promise;
}

/** Stop refreshing before logout, then let an already-sent Cookie rotation finish. */
export async function pauseSessionRefresh(): Promise<void> {
  loggingOut = true;
  sessionGeneration += 1;
  clearTimeout(refreshTimer);
  csrfToken = undefined;
  csrfRequest = undefined;
  await refreshRequest?.catch(() => undefined);
}

export function resumeSessionRefresh(): void {
  loggingOut = false;
  if (!useAuthStore.getState().tokens) return;
  if (refreshDueAt === undefined) scheduleTokenRefresh();
  else setRefreshTimer(Math.max(0, refreshDueAt - Date.now()));
}

function setRefreshTimer(delay: number): void {
  clearTimeout(refreshTimer);
  const timeout = Math.min(delay, 2_147_483_647);
  refreshDueAt = Date.now() + timeout;
  refreshTimer = setTimeout(scheduleTokenRefreshRetry, timeout);
}

function scheduleTokenRefresh(): void {
  clearTimeout(refreshTimer);
  const state = useAuthStore.getState();
  if (loggingOut || !state.tokens) return;
  const lifetime = state.tokens.expires_in;
  if (!lifetime || !Number.isFinite(lifetime) || lifetime <= 0) return;
  const delay = Math.max(1000, lifetime * 1000 - Math.min(60_000, lifetime * 100));
  setRefreshTimer(delay);
}

function scheduleTokenRefreshRetry(): void {
  refreshAccessToken().catch(() => {
    if (!loggingOut && useAuthStore.getState().tokens) {
      setRefreshTimer(30_000);
    }
  });
}

useAuthStore.subscribe((state, previous) => {
  if (state.tokens === previous.tokens) return;
  if (!state.tokens) {
    sessionGeneration += 1;
    csrfToken = undefined;
    csrfRequest = undefined;
    clearTimeout(refreshTimer);
    refreshDueAt = undefined;
    return;
  }
  loggingOut = false;
  scheduleTokenRefresh();
});

function installAuthInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const requestConfig = config as AniRequestConfig;
    if (requestConfig.aniAuth === "public") return config;
    const token = useAuthStore.getState().getAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) throw toApiError(error);
      if (axios.isCancel(error)) throw error;

      const config = error.config as AniRequestConfig | undefined;
      const isProtected = config?.aniAuth !== "public";
      const canRefresh = error.response?.status === 401 && isProtected && !config?.aniRetried;

      if (!canRefresh || !config) {
        if (error.response?.status === 401 && isProtected && config?.aniRetried && !loggingOut) {
          expireAuthSession();
        }
        throw toApiError(error);
      }

      const currentAuthState = useAuthStore.getState();
      if (!currentAuthState.tokens?.access_token) {
        expireAuthSession();
        throw toApiError(error);
      }

      config.aniRetried = true;
      const currentToken = currentAuthState.tokens.access_token;
      const token =
        config.headers.get("Authorization") !== `Bearer ${currentToken}`
          ? currentToken
          : await refreshAccessToken();
      config.headers.set("Authorization", `Bearer ${token}`);
      return instance.request(config);
    },
  );
}

installAuthInterceptors(coreAxios);
installAuthInterceptors(servicesAxios);
installAuthInterceptors(adminAxios);

async function request<TResponse, TBody>(
  instance: AxiosInstance,
  url: string,
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  const { auth = "required", ...axiosOptions } = options;
  try {
    const response = await instance.request<TResponse, AxiosResponse<TResponse>, TBody>({
      ...axiosOptions,
      url,
      aniAuth: auth,
    } as AxiosRequestConfig<TBody> & { aniAuth: ApiAuthMode });
    if (response.status === 204 || response.data === "") return undefined as TResponse;
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    throw toApiError(error);
  }
}

export function coreRequest<TResponse, TBody = never>(
  url: string,
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  return request<TResponse, TBody>(coreAxios, url, options);
}

export function servicesRequest<TResponse, TBody = never>(
  url: string,
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  return request<TResponse, TBody>(servicesAxios, url, options);
}

/** Governance tenant management endpoints under /api/v1/admin. */
export function adminRequest<TResponse, TBody = never>(
  url: string,
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  return request<TResponse, TBody>(adminAxios, url, options);
}

export const externalAxios = axios.create();
