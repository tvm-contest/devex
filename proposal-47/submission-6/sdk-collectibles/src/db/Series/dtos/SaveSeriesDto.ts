import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { LayerDto } from "./LayerDto";

export class SaveSeriesDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsString()
    @IsNotEmpty()
    public hash: string;

    @IsNotEmpty()
    public layers: LayerDto[];

    @IsString()
    @IsNotEmpty()
    public seriesId: string;

    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsNumber()
    @IsNotEmpty()
    public mintCost: number;

    @IsString()
    @IsNotEmpty()
    public creator: string;

    @IsNumber()
    @IsNotEmpty()
    public supply: number;
    
    @IsNumber()
    @IsNotEmpty()
    public maximum: number;

    @IsNumber()
    @IsNotEmpty()
    public creatorFees: number;

    public description?: string | undefined;

    @IsNumber()
    @IsNotEmpty()
    public createdAt: number;

    @IsNumber()
    @IsNotEmpty()
    public updatedAt: number;

    @IsNotEmpty()
    @IsNumber()
    public startTime: number;

    constructor(
      name: string,
      hash: string,
      layers: LayerDto[],
      seriesId: string,
      address: string,
      mintCost: number,
      creator: string,
      creatorFees: number,
      maximum: number,
      createdAt: number,
      updatedAt: number,
      startTime: number,
      description?: string,
    ) {
      this.name = name;
      this.hash = name;
      this.layers = layers;
      this.seriesId = seriesId;
      this.address = address;
      this.mintCost = mintCost;
      this.creator = creator;
      this.maximum = maximum;
      this.supply = 0;
      this.creatorFees = creatorFees;
      this.description = description;
      this.createdAt = createdAt;
      this.startTime = startTime;
      this.updatedAt = updatedAt;
    }
}
