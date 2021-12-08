import { createActionMessage } from "../../../features/Actions/createAction";
import { ActionService } from "../../../db";
import { SeriesCreate } from "../../swift-messages";
import { ISwiftMessageHandler } from "../swift-message-handler";
import { SeriesService } from "../../../db";
import { Service } from "typedi";
import { TonClientRootContract } from "../../../ton/ton-col/ton-client-root-contract";
import { TonClient } from "@tonclient/core";
import { TonClientColContractFactory } from "../../../ton/ton-col/ton-client-col-contract";
import { PinataService } from "../../../features/Pinata/PinataService";
import { generateId } from "../../../utils/generateId";
import { Double } from "mongodb";

@Service()
export class SeriesCreateHandler implements ISwiftMessageHandler<SeriesCreate> {
  private readonly pinataService: PinataService;
  constructor(
      private readonly actionService: ActionService, 
      private readonly seriesService: SeriesService, 
      private readonly tonColRootContract: TonClientRootContract,
      private readonly tonClient: TonClient,
      private readonly tonClientColContractFactory: TonClientColContractFactory
  ){
    this.pinataService = new PinataService();
  }
      
  public async processMessage(message: SeriesCreate): Promise<void> {
    const addr = await this.tonColRootContract.getCollectionAddress(message.data.id);

    if (!addr.is_success) return;
    const col = this.tonClientColContractFactory.getColContract(addr.data);
    const info = await col.getInfo();

    if (!info.is_success) return;

    await this.actionService.addAction({
      message: createActionMessage(message),
      tokenAttributes: {
        seriesID: message.data.id,
        seriesCreator: info.data.creator,
      },
      actionAttributes: {
        actionCapture: message.actionCapture,
      }
    });

    const json = await this.pinataService.getSeriesJson(info.data.hash);
    
    json.layers.forEach(layer => {
      layer.points.forEach((point) => {
        point.point = <number> <unknown> new Double(point.point);
      });
    });

    await this.seriesService.saveSeries({
      hash: info.data.hash,
      ...json,
      startTime: <number> <unknown> new Double(json.startTime || 0),
      address: addr.data,
      seriesId: generateId(this.tonColRootContract.address, info.data.id),
      createdAt: <number> <unknown> new Double(Math.round(new Date().getTime() / 1000)),
      updatedAt: <number> <unknown> new Double(Math.round(new Date().getTime() / 1000)),
    });
  }
}
