import { Column, Entity } from "typeorm";

@Entity()
export class Point {
    @Column({ type: "double" })
    public point!: number;

    @Column()
    public hash?: string | undefined;
}
