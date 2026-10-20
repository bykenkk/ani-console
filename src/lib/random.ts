import { v4 as uuidv4 } from "uuid";

export function randomString(length = 7): string {
  let value = "";
  while (value.length < length) {
    value += uuidv4().replace(/-/g, "");
  }
  return value.slice(0, length);
}
