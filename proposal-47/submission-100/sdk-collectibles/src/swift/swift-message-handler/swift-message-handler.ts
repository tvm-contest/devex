import { SwiftMessage } from "../swift-messages";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SeriesCreateHandler } from "./handlers/series-create-handler";
import { Service } from "typedi";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TokenMintHandler } from "./handlers/token-mint-handler";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MintQueryHandler } from "./handlers/mint-query-handler";

export interface ISwiftMessageHandler<T extends SwiftMessage> {
  processMessage(message: T): Promise<void>;
}

@Service()
export class SwiftMessageHandler implements ISwiftMessageHandler<SwiftMessage> {
  constructor(
      private readonly SeriesCreateHandler: SeriesCreateHandler,
      private readonly MintQueryHandler: MintQueryHandler,
      private readonly TokenMintHandler: TokenMintHandler,
  ) {
    
  }

  public async processMessage(message: SwiftMessage): Promise<void> {
    console.log(message.name, message.data);
    switch (message.code){
      case "SRC-CT":
        return this.SeriesCreateHandler.processMessage(message);
      case "SRC-PY":
        return this.MintQueryHandler.processMessage(message);
      case "TK-MT": 
        return this.TokenMintHandler.processMessage(message);
    }
  }
}
