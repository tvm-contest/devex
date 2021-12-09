import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";

@Entity({ name: "swift_message" })
export class SwiftMessage {
  @StringObjectIdColumn()
  id?: ObjectID;

  @Column({ type: "json" })
  message!: {
    actionCode?: string;
    superType?: string;
    senderAddress: string;
    time: number;
    status: string;
  };

  @Column()
  createdAt!: number;

  @Column()
  hash!: string;

  @Column({ type: "json" })
  parameters?: Record<string, any>;
}