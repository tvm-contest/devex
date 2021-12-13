import { Body, JsonController, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { PinataService } from "../Pinata/PinataService";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SeriesService, TokenService } from "../../db";
import { CreateSeriesDto } from "../../db";

@JsonController('/series')
@Service()
export class SeriesController {
    private readonly PinataService: PinataService;
    constructor(
        private readonly TokenService: TokenService,
        private readonly SeriesService: SeriesService
    ) {
      this.PinataService = new PinataService();
    }

    @Post('/generate')
    public async col(@Body() params: CreateSeriesDto) {
      const { layers } = params;
      const layersRarity = layers.map((item) => {
        return {
          layer: item.layer,
          points: this.SeriesService.generateLayerRarity(item),
          images: item.images
        };
      });
      try {
        const series = {
          ...params,
          layers: layersRarity,
        };

        const { IpfsHash: hash } = await this.PinataService.uploadJson(series);

        console.log(`Series with hash ${hash} is saved`);

        return {
          hash,
          ...series
        };
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
}
