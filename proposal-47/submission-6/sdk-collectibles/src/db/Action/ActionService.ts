import { Service } from "typedi";
import { MongoRepository } from "typeorm";
import { Double } from "mongodb";
import { InjectRepository } from "typeorm-typedi-extensions";
import * as Dtos from "./dtos/Action";
import * as Entities from "./entities/ActionMessage";

@Service()
export class ActionService {
  constructor(
    @InjectRepository(Entities.ActionMessage)
    private readonly repository: MongoRepository<Entities.ActionMessage>
  ) {}

  public async addAction(action: Dtos.ActionMessage): Promise<void> {
    if (await this.hasActionWithHash(action.message.hash)) return;

    await this.repository.insert({
      message: {
        ...action.message,
        // Fix me: cast could be fixed using dto
        time: <number> <unknown> new Double(action.message.time),
      },
      tokenAttributes: action.tokenAttributes,
      actionAttributes: action.actionAttributes,
    });
  }

  public async hasActionWithHash(hash: string): Promise<boolean> {
    const isFound = await this.repository.findOne({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      "message.hash": hash
    });

    return isFound !== undefined;
  }
}
