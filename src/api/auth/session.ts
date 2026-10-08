import { coreRequest } from "@/api/request";
import type { LogoutInput, LogoutRequest, RevokeStatusResponse } from "./types";

export function logout(submitData: LogoutInput): Promise<RevokeStatusResponse> {
  return coreRequest<RevokeStatusResponse, LogoutRequest>("/auth/logout", {
    method: "POST",
    data: submitData,
  });
}
