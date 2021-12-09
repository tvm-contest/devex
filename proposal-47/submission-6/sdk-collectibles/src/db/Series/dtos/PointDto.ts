import { Column, Entity } from "typeorm";
import { Double } from "mongodb";

@Entity()
export class PointDto {
    @Column()
    public point!: number;

    @Column()
    public hash?: string | undefined;

    constructor(
      point: number,
      hash: string | undefined
    ) {
      this.point = <number> <unknown> new Double(point);
      this.hash = hash;
    }
}
