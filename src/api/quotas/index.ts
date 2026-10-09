import { coreRequest } from "@/api/request";
import type { MyQuotaAccountsResponse } from "./types";

export function getMyQuotaAccounts(signal?: AbortSignal): Promise<MyQuotaAccountsResponse> {
  return coreRequest<MyQuotaAccountsResponse>("/me/quota-accounts", { method: "GET", signal });
}
export type * from "./types";
