import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { parseTokenExpiresIn, type TokenExpiresIn } from "@/api/auth/token";
import { createIdempotencyScope } from "@/lib/idempotency";
import { isDevelopmentAuthBypassActive, useAuthStore } from "@/stores/auth";

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
  refresh_token?: string;
  expires_in?: TokenExpiresIn;
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

const refreshScope = createIdempotencyScope("auth-refresh", ["POST"]);
let refreshRequest:
  | { refreshToken: string; promise: Promise<RefreshAccessTokenResponse> }
  | undefined;

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.assign(`/login?redirect=${encodeURIComponent(current)}`);
}

function expireAuthSession(): void {
  useAuthStore.getState().clear();
  useAuthStore.persist.clearStorage();
  redirectToLogin();
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

async function requestTokenRefresh(refreshToken: string): Promise<RefreshAccessTokenResponse> {
  const submitData = refreshToken ? { refresh_token: refreshToken } : {};
  const body = refreshToken ? refreshScope.withKey(submitData, [refreshToken]) : submitData;
  try {
    const response = await refreshAxios.post<RefreshAccessTokenResponse>("/auth/refresh", body);
    if (!response.data?.access_token) {
      throw new ApiError("刷新令牌响应缺少 access_token", { response });
    }
    if (refreshToken) refreshScope.reset([refreshToken]);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

function refreshAccessToken(refreshToken: string): Promise<RefreshAccessTokenResponse> {
  if (refreshRequest?.refreshToken === refreshToken) return refreshRequest.promise;
  const promise = requestTokenRefresh(refreshToken).finally(() => {
    if (refreshRequest?.promise === promise) refreshRequest = undefined;
  });
  refreshRequest = { refreshToken, promise };
  return promise;
}

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
      const canRefresh =
        error.response?.status === 401 &&
        isProtected &&
        !config?.aniRetried &&
        !isDevelopmentAuthBypassActive();

      if (!canRefresh || !config) throw toApiError(error);

      const currentAuthState = useAuthStore.getState();
      const refreshToken = currentAuthState.tokens?.refresh_token ?? "";
      if (!currentAuthState.tokens?.access_token) {
        expireAuthSession();
        throw toApiError(error);
      }

      config.aniRetried = true;
      try {
        const refreshed = await refreshAccessToken(refreshToken);
        const authState = useAuthStore.getState();
        authState.setAuthSession({
          tokens: {
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? refreshToken,
            expires_in: parseTokenExpiresIn(refreshed.expires_in),
          },
          username: authState.hasKnownUsername ? authState.username : null,
        });
        config.headers.set("Authorization", `Bearer ${refreshed.access_token}`);
        return await instance.request(config);
      } catch {
        expireAuthSession();
        throw toApiError(error);
      }
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
