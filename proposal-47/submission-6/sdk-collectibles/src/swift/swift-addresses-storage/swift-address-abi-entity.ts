import { StringObjectIdColumn } from "../../db";
import { Column, Entity, Index, ObjectID } from "typeorm";
import { AbiFileName } from "../../abis";

@Entity({ name: "address_abi" })
export class SwiftAddressAbiEntity {
  @StringObjectIdColumn()
  id!: ObjectID;

  @Column()
  @Index({ unique: true })
  address!: string;

  @Column()
  abi!: AbiFileName;
}
