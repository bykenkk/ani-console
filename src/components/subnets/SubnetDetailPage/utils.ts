import { parseIpRanges } from "@/lib/subnets";

export function formatIpCount(value: string | undefined): string {
  const ranges = parseIpRanges(value);
  if (!ranges) return "未知";
  return String(ranges.reduce((count, { start, end }) => count + end - start + 1, 0));
}
