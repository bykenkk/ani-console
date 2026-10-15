import {
  AUTH_APPLICATION,
  coreRequest,
  pauseSessionRefresh,
  resumeSessionRefresh,
} from "@/api/request";
import { useAuthStore } from "@/stores/auth";
import type { LogoutInput, LogoutRequest, RevokeStatusResponse } from "./types";

export async function logout(submitData: LogoutInput = {}): Promise<RevokeStatusResponse> {
  await pauseSessionRefresh();
  try {
    const response = await coreRequest<RevokeStatusResponse, LogoutRequest>("/auth/logout", {
      method: "POST",
      auth: "public",
      data: { ...submitData, application: AUTH_APPLICATION },
    });
    useAuthStore.getState().clear();
    return response;
  } catch (error) {
    resumeSessionRefresh();
    throw error;
  }
}
