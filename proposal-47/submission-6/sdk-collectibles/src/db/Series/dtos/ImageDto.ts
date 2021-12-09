import {
  IsHash,
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";

export class ImageDto {
    @IsString()
    @IsNotEmpty()
    public subtitle: string;

    @IsMimeType()
    @IsNotEmpty()
    public mimetype: string;

    @IsHash("sha256")
    @IsNotEmpty()
    public hash: string; // sha3-256

    @IsNumber()
    @IsNotEmpty()
    public width: number; // px

    @IsNumber()
    @IsNotEmpty()
    public height: number; // px

    @IsNumber()
    @IsNotEmpty()
    public weight: number; // bytes

    @IsNumber()
    @IsNotEmpty()
    public rarity: number; // bytes

    constructor(
      subtitle: string,
      mimetype: string,
      hash: string,
      width: number,
      height: number,
      weight: number,
      rarity: number,
    ) {
      this.subtitle = subtitle;
      this.mimetype = mimetype;
      this.hash = hash;
      this.width = width;
      this.height = height;
      this.weight = weight;
      this.rarity = rarity;
    }
}
