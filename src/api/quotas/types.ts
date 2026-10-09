export type QuotaEnforcement =
  | "ENFORCEMENT_UNSPECIFIED"
  | "LEGACY_CONFIG_ONLY"
  | "LAB_ONLY"
  | "ENFORCED"
  | "NOT_ENABLED";
export interface QuotaAccount {
  quotaCode: string;
  unit?: string;
  limit: string;
  occupied: string;
  available: string;
  overLimit?: boolean;
  enforcement?: QuotaEnforcement;
}
export interface MyQuotaAccountsResponse {
  tenantId: number;
  items: QuotaAccount[];
}
