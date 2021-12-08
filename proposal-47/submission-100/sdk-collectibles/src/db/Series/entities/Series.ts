import { Column, Entity, ObjectID } from "typeorm";
import { StringObjectIdColumn } from "../../decorators/StringObjectIdColumn";
import { Layer } from "./Layer";

@Entity({ name: "col1" })
export class Series {
  @StringObjectIdColumn()
  id?: ObjectID;

  @Column()
  name!: string;

  @Column()
  hash!: string;

  @Column()
  maximum!: number;

  @Column()
  address!: string;

  @Column()
  seriesId!: string;

  @Column()
  creator!: string;

  @Column()
  description?: string;

  @Column()
  supply!: number;

  @Column()
  mintCost!: number;

  @Column()
  creatorFees!: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Column((type => Layer))
  layers!: Layer[];

  @Column()
  startTime!: number;
}
