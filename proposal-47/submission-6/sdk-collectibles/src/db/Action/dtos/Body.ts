import { Message } from "./Message";

export interface IActionBody {
  message: Message<string>;
  tokenAttributes: Record<string, string | number>;
  actionAttributes: Record<string, string | number>;
}
