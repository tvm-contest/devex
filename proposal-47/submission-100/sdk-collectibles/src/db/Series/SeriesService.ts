import { InjectRepository } from "typeorm-typedi-extensions";
import { Series } from "./entities/Series";
import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import { SaveSeriesDto } from "./dtos/SaveSeriesDto";
import { ObjectID } from "typeorm/driver/mongodb/typings";
import { FindOneOptions } from "typeorm/find-options/FindOneOptions";
import { CreateLayerDto } from "./dtos/CreateLayerDto";
import { generateWeight } from "../../utils/generateWeight";
import { generatePoints } from "../../utils/generatePoints";
import { LayerDto } from "./dtos/LayerDto";
import { Point } from "./entities/Point";
import { UpdateSeriesDto } from "./dtos/UpdateSeriesDto";

@Service()
export class SeriesService {
  constructor(
        @InjectRepository(Series)
        private readonly repository: MongoRepository<Series>
  ) {}

  public async saveSeries(series: SaveSeriesDto){
    const isFound = await this.repository.findOne({ seriesId: series.seriesId });
    if (isFound) return;
    await this.repository.save(series);
  }

  public async updateSeries(query: UpdateSeriesDto, series: Record<string, unknown>){
    await this.repository.updateOne(query, series);
  }

  public async getSeries(options?: 
                             string 
                             | number 
                             | Date 
                             | ObjectID 
                             | FindOneOptions<Series> 
                             | Partial<Series>){
    return await this.repository.findOne(options);
  }

  public async getAllAddresses(){
    return await this.repository.distinct("address", {});
  }


  public generateLayerRarity(layer: CreateLayerDto) {
    const { images } = layer;
    const weights: { hash: string; weight: number; }[] = generateWeight(images);
    return generatePoints(weights);
  }

  public randomImage(layer: LayerDto): string {
    const { points } = layer;
    const point = Math.random();
    return points.find((item: Point, key: number, arr: Point[]) =>
      point < item.point && point > (arr[key - 1]?.point || 0))?.hash || '';
  }
}
