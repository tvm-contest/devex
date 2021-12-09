import { IActionBody } from "./Body";
import { Message } from "./Message";

export class ActionMintQuery implements IActionBody {
  public message!: Message<"SRC-PY">;

  // eslint-disable-next-line @typescript-eslint/ban-types
  public tokenAttributes!: {};

  public actionAttributes!: {
    actionCapture: string;
  };
}
