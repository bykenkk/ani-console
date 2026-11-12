type VncTextKey = {
  keysym: number;
  code: string;
  shift: boolean;
};

const SYMBOL_KEYS = [
  ["Backquote", "`~"],
  ["Digit1", "1!"],
  ["Digit2", "2@"],
  ["Digit3", "3#"],
  ["Digit4", "4$"],
  ["Digit5", "5%"],
  ["Digit6", "6^"],
  ["Digit7", "7&"],
  ["Digit8", "8*"],
  ["Digit9", "9("],
  ["Digit0", "0)"],
  ["Minus", "-_"],
  ["Equal", "=+"],
  ["BracketLeft", "[{"],
  ["BracketRight", "]}"],
  ["Backslash", "\\|"],
  ["Semicolon", ";:"],
  ["Quote", "'\""],
  ["Comma", ",<"],
  ["Period", ".>"],
  ["Slash", "/?"],
] as const;

// 物理键码用于 QEMU 扩展按键协议；远端需使用英文（美式）键盘布局。
export function createVncTextKeys(text: string): VncTextKey[] {
  const normalized = text.replace(/\r\n?/g, "\n");
  if (normalized.length > 2000) throw new Error("每次最多发送 2000 个字符");

  return Array.from(normalized, (character) => {
    if (character === "\n") return { keysym: 0xff0d, code: "Enter", shift: false };
    if (character === "\t") return { keysym: 0xff09, code: "Tab", shift: false };
    const keysym = character.charCodeAt(0);
    if (keysym < 0x20 || keysym > 0x7e) {
      throw new Error("暂仅支持英文、数字、常用半角符号、换行和制表符，请移除中文或其他字符");
    }
    if (character === " ") return { keysym, code: "Space", shift: false };
    if (/[a-z]/i.test(character)) {
      return { keysym, code: `Key${character.toUpperCase()}`, shift: /[A-Z]/.test(character) };
    }
    for (const [code, characters] of SYMBOL_KEYS) {
      const index = characters.indexOf(character);
      if (index !== -1) return { keysym, code, shift: index === 1 };
    }
    throw new Error("文字包含无法发送的字符");
  });
}
