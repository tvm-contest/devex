import { InjectRepository } from "typeorm-typedi-extensions";
import { Token } from "./entities/Token";
import { MongoRepository } from "typeorm";
import { Service } from "typedi";
import { CreateTokenDto } from "./dtos/CreateTokenDto";
import { ObjectLiteral } from "typeorm/common/ObjectLiteral";
import { ObjectID } from "typeorm/driver/mongodb/typings";
import { FindOneOptions } from "typeorm/find-options/FindOneOptions";

@Service()
export class TokenService {
  constructor(
        @InjectRepository(Token)
        private readonly repository: MongoRepository<Token>
  ) {}

  public async saveToken(token: CreateTokenDto){
    await this.repository.save(token);
  }

  public async getToken(options?:
                            string
                            | number
                            | Date
                            | ObjectID
                            | FindOneOptions<Token>
                            | Partial<Token>
  ){
    return await this.repository.findOne(options);
  }

  public async countTokens(token: ObjectLiteral){
    return await this.repository.count(token);
  }
}
