import { SwiftCode } from "../db";
import { Abi, DecodedMessageBody, TonClient } from "@tonclient/core";
import { MongoRepository } from "typeorm";
import { is } from "typescript-is";
import { RgResult } from "../utils/result";
import { SwiftMessage } from "./swift-messages";
import { EncodedMessage } from "./swift-watcher";

export class SwiftDecoder {
  private readonly ton: TonClient;
  private readonly parser: SwiftHandlerParser;

  constructor(ton: TonClient, parser: SwiftHandlerParser) {
    this.ton = ton;
    this.parser = parser;
  }

  public async decode(message: EncodedMessage, abi: Abi): Promise<RgResult<SwiftMessage, unknown>> {
    let decoded: DecodedMessageBody;

    try {
      decoded = await this.ton.abi.decode_message_body({
        abi,
        body: message.body,
        is_internal: true,
      });
    } catch (err: unknown) {
      return {
        is_success: false,
        error: {
          code: err
        }
      };
    }

    if (!decoded.value) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: "decoded.value is " + decoded.value
        }
      };
    }

    const data = await this.parseSwiftMessage(message, decoded);

    if (!data) {
      console.log(decoded);

      return {
        is_success: false,
        error: {
          code: -1,
          message: "Swift message validation fault"
        }
      };
    }

    return {
      is_success: true,
      data
    };
  }

  private async parseSwiftMessage(message: EncodedMessage, decoded: DecodedMessageBody): Promise<SwiftMessage | null> {
    const name = decoded.name;

    const parseResult = await this.parser.parse(name);

    if (!parseResult) {
      return null;
    }

    const result = {
      name,
      code: parseResult.code,
      majorVersion: parseResult.majorVersion,
      superType: parseResult.superType,
      actionCapture: parseResult.actionCapture,
      rawMessage: message,
      data: decoded.value
    };

    if (!is<SwiftMessage>(result)) {
      console.log(result);
      return null;
    }

    return result;
  }
}

type SwiftParseResult = {
  readonly code: string;
  readonly majorVersion: string;
  readonly actionCapture: string;
  readonly superType: string;
};

export class SwiftHandlerParser {
  private readonly repo: MongoRepository<SwiftCode>;

  constructor(repo: MongoRepository<SwiftCode>) {
    this.repo = repo;
  }

  public async parse(messageName: string): Promise<SwiftParseResult | null> {
    const splittedByUnderscore = messageName.split("_");

    const leftOperand = splittedByUnderscore.slice(0, 2).join("-"); // TK-CO
    const rightOperand = splittedByUnderscore.slice(2).join("."); // nifi.art1.1

    const repoEntry = await this.repo.findOne({
      where: {
        code: leftOperand
      },
    });

    if (!repoEntry) {
      return null;
    }

    const majorVersion = rightOperand.slice(0, rightOperand.lastIndexOf(".")); // nifi.art1

    if (!repoEntry.applicableContractType.includes(majorVersion)) {
      return null;
    }

    return {
      code: leftOperand,
      majorVersion,
      actionCapture: repoEntry.actionCapture,
      superType: rightOperand
    };
  }
}
