export type TokenExpiresIn = number | string;

export function parseTokenExpiresIn(value: TokenExpiresIn | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number(value);
}
