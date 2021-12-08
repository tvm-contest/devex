import { Column, Entity } from "typeorm";
import { Image } from "./Image";
import { Point } from "./Point";

@Entity()
export class Layer {
    @Column()
    public layer!: string;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Column((type) => Image)
    public images!: Image[];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Column((type) => Point)
    public points!: Point[];
}
