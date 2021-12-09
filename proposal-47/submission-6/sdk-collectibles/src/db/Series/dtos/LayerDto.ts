import { IsNotEmpty, IsString } from "class-validator";
import { ImageDto } from "./ImageDto";
import { PointDto } from "./PointDto";

export class LayerDto {
    @IsString()
    @IsNotEmpty()
    public layer: string;

    @IsNotEmpty()
    public images: ImageDto[];

    @IsNotEmpty()
    public points: PointDto[];

    constructor(
      layer: string,
      images: ImageDto[],
      points: PointDto[]
    ) {
      this.layer = layer;
      this.images = images;
      this.points = points;
    }
}
