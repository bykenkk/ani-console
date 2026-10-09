import { adminRequest, coreRequest } from "@/api/request";
import type {
  VerifyLoginMfaInput,
  VerifyLoginMfaRequest,
  PasswordLoginResponse,
  ForgotPasswordInput,
  ForgotPasswordRequest,
  AcceptInvitationInput,
  AcceptInvitationRequest,
} from "./types";

// None of these public authentication contracts declares a client idempotency key.
/** Current implementation supports TOTP and returns the real LoginResponse plus refresh Cookie. */
export function verifyLoginMfa(
  input: VerifyLoginMfaInput,
  signal?: AbortSignal,
): Promise<PasswordLoginResponse> {
  return adminRequest<PasswordLoginResponse, VerifyLoginMfaRequest>("/mfa/verify", {
    method: "POST",
    auth: "public",
    data: input,
    signal,
  });
}
export async function requestPasswordResetCode(
  input: ForgotPasswordInput,
  signal?: AbortSignal,
): Promise<void> {
  await coreRequest<unknown, ForgotPasswordRequest>("/auth/forgot-password", {
    method: "POST",
    auth: "public",
    data: input,
    signal,
  });
}
export async function acceptAccountInvitation(
  input: AcceptInvitationInput,
  signal?: AbortSignal,
): Promise<void> {
  await coreRequest<unknown, AcceptInvitationRequest>("/auth/invitations/accept", {
    method: "POST",
    auth: "public",
    data: input,
    signal,
  });
}
