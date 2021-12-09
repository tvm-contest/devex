import { createActionMessage } from "../../../features/Actions/createAction";
import { ActionService, Image, TokenService } from "../../../db";
import { TokenMint } from "../../swift-messages";
import { ISwiftMessageHandler } from "../swift-message-handler";
import { SeriesService } from "../../../db";
import { Service } from "typedi";
import { TonClientRootContract } from "../../../ton/ton-col/ton-client-root-contract";
import { TonClient } from "@tonclient/core";
import { TonClientColContractFactory } from "../../../ton/ton-col/ton-client-col-contract";
import { PinataService } from "../../../features/Pinata/PinataService";
import { generateId, generateTokenId } from "../../../utils/generateId";
import { Double } from "mongodb";
import { ITonTokenContractFactory } from "../../../ton/ton-tokens/ton-token-contract";
import Jimp from "jimp";
import * as fs from "fs";
import { Series } from "../../../db/Series/entities/Series";
import { PinataPinResponse } from "@pinata/sdk";

@Service()
export class TokenMintHandler implements ISwiftMessageHandler<TokenMint> {
  private readonly pinataService: PinataService;
  constructor(
      private readonly actionService: ActionService,
      private readonly seriesService: SeriesService,
      private readonly tonColRootContract: TonClientRootContract,
      private readonly tonClient: TonClient,
      private readonly tonClientColContractFactory: TonClientColContractFactory,
      private readonly tokenService: TokenService,
      private readonly tonTokenContractFactory: ITonTokenContractFactory,
  ){
    this.pinataService = new PinataService();
  }

  public async getTokenImages(props: getTokenImagesProps): Promise<getTokenImagesReturn | undefined> {
    const { json, message, seriesId } = props;
    try {
      const imagesFiles: string[] = await Promise.all(await json.layers.map(async (layer, key) => {
        await this.pinataService.sleep(1000);

        let res = undefined;
        while (!res) {
          res = await this.pinataService.getImage(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              layer.images[parseInt(message.data[`id${key + 1}`], 10)]?.hash || '',
              seriesId,
              (key + 1).toString()
          );
        }
        return res;
      }));

      if (!imagesFiles[0]) return;

      const jimps: Jimp[] = await Promise.all(imagesFiles.map(async item => await Jimp.read(item)));

      if (!jimps[0]) return;

      let finalImage: Jimp = jimps[0];

      await jimps.map(async (item, key) => {
        if (key === 0) {
          finalImage = item;
        } else {
          await finalImage.composite(item, 0, 0);
        }
      });
      const buffer = await finalImage.getBufferAsync(await finalImage.getMIME());

      const ipfs = await this.pinataService.uploadBuffer(buffer, await finalImage.getExtension());

      return { ipfs, imagesFiles };
    } catch (e) {
      console.log('Pinata handle image error');
      return;
    }
  }

  public async processMessage(message: TokenMint): Promise<void> {
    const addr = await this.tonColRootContract.getCollectionAddress(message.data.collectionId);

    if (!addr.is_success) return;
    const col = this.tonClientColContractFactory.getColContract(addr.data);
    const info = await col.getInfo();

    if (!info.is_success) return;

    const tokenAddr = await col.getTokenAddress(
        message.data.id1,
        message.data.id2,
        message.data.id3,
        message.data.id4,
        message.data.id5
    );

    if (!tokenAddr.is_success) return;
    const token = this.tonTokenContractFactory.getTokenContract(tokenAddr.data.addr);
    let tokenInfo = await token.getTradeInfo();

    while (!tokenInfo.is_success
    && tokenInfo.error.message === 'TON SDK returned empty response on BOC request'){
      tokenInfo = await token.getTradeInfo();
    }

    if (!tokenInfo.is_success) return;

    const seriesId = generateId(this.tonColRootContract.address, message.data.collectionId);
    const tokenId = generateTokenId(seriesId, message.data.index);

    await this.actionService.addAction({
      message: createActionMessage(message),
      tokenAttributes: {
        seriesID: seriesId,
        tokenID: tokenId,
      },
      actionAttributes: {
        actionCapture: message.actionCapture,
      }
    });

    const json = await this.pinataService.getSeriesJson(info.data.hash);

    let imagesInfo = await this.getTokenImages({ seriesId, json, message });

    while (!imagesInfo) {
      imagesInfo = await this.getTokenImages({ seriesId, json, message });
    }

    const res = this.tokenService.saveToken({
      tokenId,
      images: json.layers.map((layer, key) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return layer.images[parseInt(message.data[`id${key + 1}`], 10)];
      }) as Image[],
      merged: imagesInfo.ipfs.IpfsHash,
      address: addr.data,
      seriesId: generateId(this.tonColRootContract.address, info.data.id),
      createdAt: <number> <unknown> new Double(Math.round(new Date().getTime() / 1000)),
      updatedAt: <number> <unknown> new Double(Math.round(new Date().getTime() / 1000)),
      owner: tokenInfo.data.owner, //tokenInfo.data.owner
    });

    await this.seriesService.updateSeries({ seriesId }, {
      $set: {
        supply: parseInt(message.data.index || '0', 10),
      }
    });

    await imagesInfo.imagesFiles.map(async (item) => {
      await fs.promises.unlink(item);
    });

    return res;
  }
}

interface getTokenImagesReturn {
  ipfs: PinataPinResponse; imagesFiles: string[];
}

interface getTokenImagesProps{
  seriesId: string; json: Omit<Series, "hash">; message: TokenMint;
}
