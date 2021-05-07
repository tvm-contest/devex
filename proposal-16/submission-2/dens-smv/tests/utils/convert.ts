const convert = (from, to) => (str) => Buffer.from(str, from).toString(to);

export const utf8ToHex = convert("utf8", "hex");

export const genRandonHex = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

export const utf8ToBase64 = convert("utf8", "base64");
export const base64ToUtf8 = convert("base64", "utf8");
