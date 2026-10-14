import type { IpInterval } from "@/lib/subnets";

function ipv4Address(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

export function ipRangePage(ranges: IpInterval[], offset: number, limit = 100): string[] {
  const result: string[] = [];
  for (const { start, end } of ranges) {
    const size = end - start + 1;
    if (offset >= size) {
      offset -= size;
      continue;
    }
    for (let value = start + offset; value <= end && result.length < limit; value++)
      result.push(ipv4Address(value));
    offset = 0;
    if (result.length === limit) break;
  }
  return result;
}
