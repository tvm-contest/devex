import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { LayerDto } from "./LayerDto";

export class CreateSeriesDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNumber()
    @IsNotEmpty()
    public maximum: number;

    @IsNumber()
    @IsNotEmpty()
    public mintCost: number;

    @IsNumber()
    @IsNotEmpty()
    public supply = 0;

    @IsString()
    @IsNotEmpty()
    public creator: string;
    
    public description: string | undefined;

    @IsNumber()
    @IsNotEmpty()
    public creatorFees: number;

    @IsNotEmpty()
    public layers: LayerDto[];

    @IsNumber()
    @IsNotEmpty()
    public startTime: number;

    constructor(
      name: string,
      maximum: number,
      layers: LayerDto[],
      mintCost: number,
      creator: string,
      creatorFees: number,
      startTime: number,
      description?: string,
    ) {
      this.maximum = maximum;
      this.name = name;
      this.layers = layers;
      this.mintCost = mintCost;
      this.creator = creator;
      this.description = description;
      this.creatorFees = creatorFees;
      this.description = description;
      this.startTime = startTime;
    }
}
