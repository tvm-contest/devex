import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";
import { IActionBody } from "../dtos/Body";
import { Message } from "../dtos/Message";

@Entity({ name: "action" })
export class ActionMessage implements IActionBody {
  @StringObjectIdColumn()
  id?: ObjectID;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Column((type) => Message)
  public message!: Message<string>;

  @Column({ type: "json" })
  public tokenAttributes!: Record<string, string | number>;

  @Column({ type: "json" })
  public actionAttributes!: Record<string, string | number>;

  constructor(
    message: Message<string>,
    tokenAttributes: Record<string, string | number>,
    actionAttributes: Record<string, string | number>) {
    this.message = message;
    this.tokenAttributes = tokenAttributes;
    this.actionAttributes = actionAttributes;
  }
}
