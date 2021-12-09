import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";

@Entity({ name: "swift_last_message_time" })
export class LastMessageTime {
    @StringObjectIdColumn()
    id!: ObjectID;

    @Column()
    time!: number;
}
