import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ImageDto } from "./ImageDto";

export class CreateTokenDto {
    @IsString()
    @IsNotEmpty()
    public tokenId: string;

    @IsNotEmpty()
    public images: ImageDto[];

    @IsString()
    @IsNotEmpty()
    public seriesId: string;

    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsNumber()
    @IsNotEmpty()
    public createdAt: number;

    @IsNumber()
    @IsNotEmpty()
    public updatedAt: number;

    @IsString()
    @IsNotEmpty()
    public owner: string;

    @IsString()
    @IsNotEmpty()
    public merged: string;

    constructor(
      tokenId: string,
      seriesId: string,
      images: ImageDto[],
      address: string,
      createdAt: number,
      updatedAt: number,
      owner: string,
      merged: string,
    ) {
      this.tokenId = tokenId;
      this.seriesId = seriesId;
      this.images = images;
      this.address = address;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      this.owner = owner;
      this.merged = merged;
    }
}
