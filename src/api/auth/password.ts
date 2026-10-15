import { coreRequest, initializeCsrfToken, pauseSessionRefresh } from "@/api/request";
import type {
  AuthTokenPair,
  PasswordLoginInput,
  PasswordLoginRequest,
  PasswordLoginResponse,
} from "./types";
import { parseTokenExpiresIn } from "./token";

export async function passwordLogin(submitData: PasswordLoginInput): Promise<AuthTokenPair> {
  await pauseSessionRefresh();
  const response = await coreRequest<PasswordLoginResponse, PasswordLoginRequest>(
    "/auth/password/login",
    {
      method: "POST",
      auth: "public",
      data: submitData,
    },
  );
  if (response.mfa_required) {
    throw new Error("当前账号需要二次验证，登录页暂未接入 MFA");
  }
  if (!response.access_token) {
    throw new Error("登录响应缺少 access_token");
  }
  await initializeCsrfToken();
  return {
    access_token: response.access_token,
    expires_in: parseTokenExpiresIn(response.expires_in) ?? 0,
    issued_at: response.issued_at,
  };
}
