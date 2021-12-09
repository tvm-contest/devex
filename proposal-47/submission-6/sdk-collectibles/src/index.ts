import 'source-map-support/register';
import "reflect-metadata";
import dotenv from 'dotenv';
import { createServer } from './configs/createServer';
import { connectDatabase } from "./configs/connectDatabase";
import { TonClient } from "@tonclient/core";
import { Abis } from "./abis";
import { libNode } from "@tonclient/lib-node";
import { TonClientRootContract } from "./ton/ton-col/ton-client-root-contract";
import { Config } from "./config";
import { SwiftAbiFinder } from "./swift/swift-abi-finder";
import {
  ActionMessage,
  ActionService,
  AddressAbi,
  LastMessageTime,
  SeriesService, SwiftCode,
  SwiftMessage,
  SwiftService, Token, TokenService
} from "./db";
import { SwiftMessageHandler } from "./swift/swift-message-handler/swift-message-handler";
import { SeriesCreateHandler } from "./swift/swift-message-handler/handlers/series-create-handler";
import { MintQueryHandler } from "./swift/swift-message-handler/handlers/mint-query-handler";
import { TokenMintHandler } from "./swift/swift-message-handler/handlers/token-mint-handler";
import { Series } from "./db/Series/entities/Series";
import { SwiftWatcher } from "./swift/swift-watcher";
import { SwiftManager } from "./swift/swift-manager";
import { SwiftDecoder, SwiftHandlerParser } from "./swift/swift-decoder";
import { TonClientColContractFactory } from "./ton/ton-col/ton-client-col-contract";
import { TonClientTokenContractFactory } from "./ton/ton-tokens/ton-client-token-contract";
import * as fs from "fs";
import path from "path";

dotenv.config();
TonClient.useBinaryLibrary(libNode);

// eslint-disable-next-line @typescript-eslint/ban-types
const run = async (params?: {controllers?: Function[]; middlewares?: Function[];}) => {
  // deleting old file, if they exist
  if (await fs.existsSync(path.resolve(__dirname, '../public'))) {
    await fs.promises.rm(path.resolve(__dirname, '../public'), { recursive: true });
  }

  const swiftUpdateIntervalMs = +(process.env.SWIFT_UPDATE_INTERVAL_MS_SDK || '1000');
  const tonUrls = (process.env.TON_ENDPOINTS ?? "").split("|").filter(Boolean);
  const config = {
    ton: {
      tonUrls,
      colRoot: process.env.COL_ROOT_ADDR,
      swiftAddress: ":" + process.env.SWIFT_HASH_SDK,
      swiftUpdateIntervalMs,
    },
    mongodb: process.env.MONGODB_URL_SDK,
  } as Partial<Config>;

  console.log("Database initialization...");
  const connection = await connectDatabase();

  console.log("TON Tools initialization...");
  const tonClient = new TonClient({
    network: { endpoints: config.ton?.tonUrls },
  });

  const abis = new Abis();

  const tonClientColRoot = new TonClientRootContract(tonClient, config.ton?.colRoot || '');
  const tonClientColContractFactory = new TonClientColContractFactory(tonClient);
  const tonClientTokenContractFactory = new TonClientTokenContractFactory(tonClient);

  const abiFinder = new SwiftAbiFinder({
    colRoot: config.ton?.colRoot || '',
  }, connection.getMongoRepository(AddressAbi), abis, connection.getMongoRepository(Series));

  const actionService = new ActionService(connection.getMongoRepository(ActionMessage));
  const seriesService = new SeriesService(connection.getMongoRepository(Series));
  const tokenService = new TokenService(connection.getMongoRepository(Token));

  const swiftMessageHandler = new SwiftMessageHandler(
      new SeriesCreateHandler(
          actionService,
          seriesService,
          tonClientColRoot,
          tonClient,
          tonClientColContractFactory
      ),
      new MintQueryHandler(
          actionService,
          seriesService,
          tonClientColRoot,
          tonClient,
          tonClientColContractFactory,
          tokenService
      ),
      new TokenMintHandler(
          actionService,
          seriesService,
          tonClientColRoot,
          tonClient,
          tonClientColContractFactory,
          tokenService,
          tonClientTokenContractFactory
      )
  );

  const lastMessageTimeRepo = connection.getMongoRepository(LastMessageTime);

  console.log("SWIFT watcher initialization...");
  const swiftWatcher = new SwiftWatcher({
    swiftAddress: config.ton?.swiftAddress || '',
    checkMessagesIntervalMs: config.ton?.swiftUpdateIntervalMs || 1000,
  }, tonClient, lastMessageTimeRepo);

  const swiftService = new SwiftService(connection.getMongoRepository(SwiftMessage));
  const swiftHandlerParser = new SwiftHandlerParser(connection.getMongoRepository(SwiftCode));

  new SwiftManager(
      actionService,
      swiftWatcher,
      new SwiftDecoder(tonClient, swiftHandlerParser),
      abiFinder,
      swiftMessageHandler,
      swiftService
  );

  swiftWatcher.start();

  createServer(params);
};

run();

export default {};
