import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";

@Entity()
export class Message<ActionCode extends string> {
  @StringObjectIdColumn()
  id?: ObjectID;

  @Column()
  public hash!: string;

  @Column()
  public actionCode!: ActionCode;

  @Column()
  public superType!: string;

  @Column()
  public senderID!: string;
  
  @Column()
  public senderAddress!: string;

  @Column({ type: "double" })
  public time!: number;
}