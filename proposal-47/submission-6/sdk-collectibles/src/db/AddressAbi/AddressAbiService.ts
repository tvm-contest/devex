import { MongoRepository } from "typeorm";
import { AbiFileName } from "../../abis";
import { AddressAbi } from "./entities/AddressAbi";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";

@Service()
export class AddressAbiService {
  constructor(
      @InjectRepository(AddressAbi)
      private readonly repository: MongoRepository<AddressAbi>
  ) {}

  public async getAbiByAddress(address: string): Promise<AbiFileName | null> {
    const result = await this.repository.findOne({ address });
    return result?.abi || null;
  }

  public async setAbiByAddress(address: string, abi: AbiFileName): Promise<void> {
    await this.repository.insert({ address, abi });
  }
}
