import { ActionService, Image, TokenService } from "../../../db";
import { MintQuery } from "../../swift-messages";
import { ISwiftMessageHandler } from "../swift-message-handler";
import { SeriesService } from "../../../db";
import { Service } from "typedi";
import { TonClientRootContract } from "../../../ton/ton-col/ton-client-root-contract";
import { TonClient } from "@tonclient/core";
import { TonClientColContractFactory } from "../../../ton/ton-col/ton-client-col-contract";
import { Abis } from "../../../abis";
import { ParamsOfProcessMessage } from "@tonclient/core/dist/modules";
import { generateId } from "../../../utils/generateId";
import { TonTokenContractGetColInfoResult } from "../../../ton/ton-col/ton-col-contract";
import { PinataService } from "../../../features/Pinata/PinataService";

@Service()
export class MintQueryHandler implements ISwiftMessageHandler<MintQuery> {
  private readonly Abis: Abis;
  private readonly pinataService: PinataService;
  constructor(
      private readonly actionService: ActionService, 
      private readonly seriesService: SeriesService, 
      private readonly tonColRootContract: TonClientRootContract,
      private readonly tonClient: TonClient,
      private readonly tonClientColContractFactory: TonClientColContractFactory,
      private readonly tokenService: TokenService,
  ){
    this.Abis = new Abis();
    this.pinataService = new PinataService();
  }
  
  private async sendTransaction(
    message: MintQuery, 
    seriesId: string, 
    info: TonTokenContractGetColInfoResult, 
    addr: string
  ) {
    const { MSIG_ADDRESS, MSIG_PUBLIC, MSIG_SECRET } = process.env;
    let flag = true;
    const series = await this.seriesService.getSeries({
      seriesId
    });

    if (!series) {
      console.log('This series doesn\'t exist');
      return;
    } else if (parseInt(message.data.futureId, 10) > parseInt(info.limit, 10)) {
      console.log('Last token is minted');
      return;
    }

    let images: Image[] | undefined;

    while (flag){
      const hashes: string[] | undefined = series.layers.map((item) => {
        return this.seriesService.randomImage(item);
      });

      images = hashes.map((item, key) => {
        return {
          ...(series.layers[key]?.images.find(image => image.hash === item) as Image),
          hash: item,
        };
      });

      if (!await this.tokenService.getToken({ images })) {
        flag = false;
      }
    }

    const body = await this.tonClient.abi.encode_message_body({
      abi: this.Abis.get('Collection'),
      call_set: {
        function_name: "mint",
        input: {
          mintId: message.data.futureId,
          owner: message.data.owner,
          ...series.layers.reduce(
            (o, layer, key) =>
              Object.assign(o, {
                [`id${key + 1}`]: layer.images.findIndex((item) => item.hash === images?.[key]?.hash) || 0
              }),
            {}),
        }
      },
      is_internal: true,
      signer: {
        type: "None"
      }
    });

    console.log("encode_message_body done");

    const params: ParamsOfProcessMessage = {
      send_events: false,
      message_encode_params: {
        address: MSIG_ADDRESS,
        abi: this.Abis.get('msig'),
        call_set: {
          function_name: 'sendTransaction',
          input: {
            dest: addr,
            value: message.data.value,
            bounce: true,
            flags: 1,
            payload: body.body
          }
        },
        signer: {
          type: 'Keys',
          keys: {
            public: MSIG_PUBLIC || '',
            secret: MSIG_SECRET || ''
          }
        }
      }
    };

    console.log("call msig");

    try {
      const response = await this.tonClient.processing.process_message(params);
      console.log(`Send money to root with output ${response.decoded?.output}, ${response.transaction?.id}`);
      return true;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
      
  public async processMessage(message: MintQuery): Promise<void> {
    const addr = await this.tonColRootContract.getCollectionAddress(message.data.collectionId);
    if (!addr.is_success) return;
    const col = this.tonClientColContractFactory.getColContract(addr.data);
    const info = await col.getInfo();

    if (!info.is_success) return ;

    if (parseInt(info.data.totalSupply, 10) !== (parseInt(message.data.futureId, 10) - 1)) return;

    const seriesId = generateId(this.tonColRootContract.address, message.data.collectionId);

    let res = await this.sendTransaction(message, seriesId, info.data, addr.data);
    while (!res) {
      console.log('sendTransaction');
      res = await this.sendTransaction(message, seriesId, info.data, addr.data);
    }
    return;
  }
}
