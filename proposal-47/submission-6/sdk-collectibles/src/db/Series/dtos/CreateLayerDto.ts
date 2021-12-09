import { IsNotEmpty, IsString } from "class-validator";
import { ImageDto } from "./ImageDto";

export class CreateLayerDto {
    @IsString()
    @IsNotEmpty()
    public layer: string;

    @IsNotEmpty()
    public images: ImageDto[];

    constructor(
      layer: string,
      images: ImageDto[]
    ) {
      this.layer = layer;
      this.images = images;
    }
}
