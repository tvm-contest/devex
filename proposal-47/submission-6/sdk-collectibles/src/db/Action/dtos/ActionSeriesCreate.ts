import { IActionBody } from "./Body";
import { Message } from "./Message";

export class ActionSeriesCreate implements IActionBody {
  public message!: Message<"SRC-CT">;

  public tokenAttributes!: {
    seriesID: string;
    seriesCreator: string;
  };

  public actionAttributes!: {
    actionCapture: string;
  };
}
