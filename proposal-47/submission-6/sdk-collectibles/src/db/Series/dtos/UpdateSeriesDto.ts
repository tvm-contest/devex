import { IsString } from "class-validator";
import { LayerDto } from "./LayerDto";

export class UpdateSeriesDto {
    @IsString()
    public name?: string;

    @IsString()
    public seriesId?: string;

    @IsString()
    public hash?: string;

    public layers?: LayerDto[];

    constructor(
      name?: string,
      hash?: string,
      seriesId?: string,
      layers?: LayerDto[]
    ) {
      this.name = name;
      this.seriesId = seriesId;
      this.hash = name;
      this.layers = layers;
    }
}
