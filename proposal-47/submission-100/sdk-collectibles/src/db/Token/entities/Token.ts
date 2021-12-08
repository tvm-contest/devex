import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";
import { Image } from "./Image";

@Entity()
export class Token {
  @StringObjectIdColumn()
  id?: ObjectID;

  @Column()
  tokenID!: string;

  @Column()
  seriesID!: string;

  @Column()
  address!: string;

  @Column()
  owner!: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Column((type => Image))
  images!: Image[];
}
