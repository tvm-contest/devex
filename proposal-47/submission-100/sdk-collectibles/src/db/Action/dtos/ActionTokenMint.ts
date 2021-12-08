import { IActionBody } from "./Body";
import { Message } from "./Message";

export class ActionTokenMint implements IActionBody {
  public message!: Message<"TK-MT">;

  // eslint-disable-next-line @typescript-eslint/ban-types
  public tokenAttributes!: {};

  public actionAttributes!: {
    actionCapture: string;
  };
}
