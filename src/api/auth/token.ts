export type TokenExpiresIn = number | string;

export function parseTokenExpiresIn(value: TokenExpiresIn | undefined): number | undefined {
  if (value === undefined) return undefined;
  const expiresIn = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(expiresIn) || expiresIn < 0) {
    throw new Error("令牌响应包含无效 expires_in");
  }
  return expiresIn;
}
