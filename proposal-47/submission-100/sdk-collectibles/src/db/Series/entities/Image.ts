import { Column, Entity } from "typeorm";

@Entity()
export class Image {
    @Column()
    public subtitle!: string;

    @Column()
    public mimetype!: string;

    @Column()
    public hash!: string; // sha3-256

    @Column()
    public width!: number; // px

    @Column()
    public height!: number; // px

    @Column()
    public weight!: number; // bytes

    @Column()
    public rarity!: number; // bytes
}
