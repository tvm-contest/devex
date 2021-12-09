import { Service } from "typedi";
import { MongoRepository } from "typeorm";
import { Double } from "mongodb";
import { InjectRepository } from "typeorm-typedi-extensions";
import { SwiftMessage } from "./entities/SwiftMessage";

@Service()
export class SwiftService {
  constructor(
    @InjectRepository(SwiftMessage)
    private readonly repository: MongoRepository<SwiftMessage>
  ) {}

  public async addSwiftMessage(swiftMessage: SwiftMessage): Promise<void> {
    if (await this.hasActionWithHash(swiftMessage.hash)) return;

    swiftMessage.message.time = <number> <unknown> new Double(swiftMessage.message.time);
    swiftMessage.createdAt = <number> <unknown> new Double(swiftMessage.createdAt);

    await this.repository.insert(swiftMessage);
  }

  public async hasActionWithHash(hash: string): Promise<boolean> {
    const isFound = await this.repository.findOne({
      where: {
        "message.hash": hash
      }
    });

    return isFound !== undefined;
  }
}
