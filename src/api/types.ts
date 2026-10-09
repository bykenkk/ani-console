export interface CoreDevProfileInfo {
  mode: "local" | "real";
  provider: string;
  real_provider: boolean;
  reason?: string | null;
}

export interface CursorPageParams {
  limit?: number;
  /** Zero-based item offset, encoded as a string: page 2 at size 10 uses "10". */
  cursor?: string;
}
