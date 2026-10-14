import type { NetworkSubnet } from "@/api/network";

export type IpInterval = { start: number; end: number };

function ipv4Number(value: string): number | undefined {
  const parts = value.split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)
  )
    return;
  return parts.reduce((result, part) => result * 256 + Number(part), 0);
}
/** Parse comma-separated IPv4 addresses and inclusive start-end ranges. */
export function parseIpRanges(value: unknown): IpInterval[] | undefined {
  if (typeof value !== "string") return;
  if (value === "") return [];
  const intervals: IpInterval[] = [];
  for (const entry of value.split(",")) {
    const parts = entry.trim().split("-");
    if (parts.length > 2) return;
    const start = ipv4Number(parts[0].trim());
    const end = ipv4Number((parts[1] ?? parts[0]).trim());
    if (start === undefined || end === undefined || start > end) return;
    intervals.push({ start, end });
  }
  intervals.sort((a, b) => a.start - b.start);
  const merged: IpInterval[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end + 1) last.end = Math.max(last.end, interval.end);
    else merged.push({ ...interval });
  }
  return merged;
}

export function ipInRanges(ranges: IpInterval[], address: string): boolean {
  const value = ipv4Number(address);
  return value !== undefined && ranges.some(({ start, end }) => value >= start && value <= end);
}

export function subnetIpUnavailableReason(subnet?: NetworkSubnet): string | undefined {
  if (!subnet) return "请先选择子网";
  if (subnet.state !== "available") return "子网当前不可用";
  if (subnet.observation_stale) return "地址观测已过期，请刷新后重试";
  const ranges = parseIpRanges(subnet.available_ip_range);
  if (!ranges) return "尚无有效的可用地址范围";
  if (!ranges.length) return "当前子网没有可用地址";
}
