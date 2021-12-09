import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";

@Entity({ name: "swift_code" })
export class SwiftCode {
    @StringObjectIdColumn()
    id!: ObjectID;

    @Column()
    readonly code!: string;

    @Column({ type: "json" })
    readonly applicableContractType!: string[];

    @Column()
    readonly actionCapture!: string;
}
