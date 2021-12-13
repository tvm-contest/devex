import { MongoRepository } from "typeorm";
import { LastMessageTime } from "./entities/LastMessageTime";
import { InjectRepository } from "typeorm-typedi-extensions";

export class LastMessageTimeService {
  constructor(
        @InjectRepository(LastMessageTime)
        private readonly repository: MongoRepository<LastMessageTime>
  ) {
  }
    
  public async get(): Promise<LastMessageTime | undefined> {
    return await this.repository.findOne({});
  }

  public async set(value: number): Promise<void> {
    await this.repository.delete({});

    await this.repository.save({
      time: value
    });
  }
}
