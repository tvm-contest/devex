import { Abi } from "@tonclient/core";
import { Abis } from "../abis";
import { AddressAbi, AddressAbiService, SeriesService } from "../db";
import { MongoRepository } from "typeorm";
import { Series } from "../db/Series/entities/Series";

export type SwiftAbiFinderConfig = {
  readonly colRoot: string;
};

export class SwiftAbiFinder {
  private readonly config: SwiftAbiFinderConfig;

  private readonly seriesService: SeriesService;
  private readonly storage: AddressAbiService;
  private readonly abis: Abis;

  constructor(
    config: SwiftAbiFinderConfig,
    repository: MongoRepository<AddressAbi>,
    abis: Abis,
    seriesRepo: MongoRepository<Series>) {
    this.config = config;
    this.storage = new AddressAbiService(repository);
    this.abis = abis;
    this.seriesService = new SeriesService(seriesRepo);
  }

  public async findAbi(address: string): Promise<Abi | null> {
    if (address === this.config.colRoot) {
      return this.abis.get("CollectionRoot");
    }
    
    const addresses = await this.seriesService.getAllAddresses();

    if (addresses.includes(address)){
      return this.abis.get("Collection");
    }

    const abiFileName = await this.storage.getAbiByAddress(address);
    if (!abiFileName) return null;

    return this.abis.get(abiFileName);
  }
}
