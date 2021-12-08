import {
  ITonTokenContract,
  ITonTokenContractFactory,
  TonTokenContractGetTradeInfoResult
} from "./ton-token-contract";

import * as fs from "fs";
import { RgResult } from "../../utils/result";

import { Abi, ResultOfRunTvm, TonClient } from "@tonclient/core";
import { isStruct } from "../../utils/utils";
import { is } from "typescript-is";

const TOKEN_ABI: Abi = {
  type: "Contract",
  value: JSON.parse(fs.readFileSync("./abi/CollectionToken.abi.json", "utf-8")),
};

type TradeInfoResult = {
  readonly owner: string;
  readonly creator: string;
  readonly creatorFees: string;
  readonly manager: string;
  readonly managerUnlockTime: string;
};

type BocResult = {
  readonly boc: string;
};

export class TonClientTokenContractFactory implements ITonTokenContractFactory {
  private readonly tonClient: TonClient;

  constructor(tonClient: TonClient) {
    this.tonClient = tonClient;
  }

  public getTokenContract(
    addr: string
  ): ITonTokenContract {
    return new TonClientTokenContract(this.tonClient, addr);
  }
}

export class TonClientTokenContract implements ITonTokenContract {
  private readonly tonClient: TonClient;
  private readonly address: string;

  constructor(tonClient: TonClient, address: string) {
    this.tonClient = tonClient;
    this.address = address;
  }

  public getAddress(): string {
    return this.address;
  }

  public async getTradeInfo(): Promise<RgResult<TonTokenContractGetTradeInfoResult, number>> {
    const result = await this.invoke("getTradeInfo");

    if (!result.is_success) {
      return result;
    }

    if (!is<TradeInfoResult>(result.data)) {
      console.log(
        "Response validation fault to getInfo for address",
        this.address
      );
      console.log(result.data);

      return {
        is_success: false,
        error: {
          code: -1,
          message: "Validation fault",
        },
      };
    }

    return {
      is_success: true,
      data: result.data,
    };
  }

  private async invoke(
    functionName: string
  ): Promise<RgResult<unknown, number>> {
    const bocResult = await this.getBoc();

    if (!bocResult.is_success) {
      return bocResult;
    }

    let result: ResultOfRunTvm;

    try {
      const encodedMessage = await this.tonClient.abi.encode_message({
        abi: TOKEN_ABI,
        signer: {
          type: "None",
        },
        call_set: {
          function_name: functionName,
          input: {},
        },
        address: this.address,
      });

      result = await this.tonClient.tvm.run_tvm({
        message: encodedMessage.message,
        account: bocResult.data,
      });
    } catch (err: any) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: err.message,
        },
      };
    }

    const rawMessage = result.out_messages[0];
    if (!rawMessage) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: "Response does not contain messages",
        },
      };
    }

    const decoded = await this.tonClient.abi.decode_message({
      abi: TOKEN_ABI,
      message: rawMessage,
    });

    if (!decoded.value) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: "Response does not contain useful data",
        },
      };
    }

    return {
      is_success: true,
      data: decoded.value,
    };
  }

  private async getBoc(): Promise<RgResult<string, number>> {
    let result: unknown[];

    try {
      const queryCollectionResult = await this.tonClient.net.query_collection({
        collection: "accounts",
        filter: {
          id: { eq: this.address },
        },
        result: "boc id",
        limit: 1,
      });

      result = queryCollectionResult.result;
    } catch (err: any) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: err.message,
        },
      };
    }

    if (!result[0]) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: "TON SDK returned empty response on BOC request",
        },
      };
    }

    const validatedBoc = getValidatedBocResult(result[0]);

    if (!validatedBoc) {
      console.log(
        "Validation fault for attempt to get token BOC for address",
        this.address
      );
      console.log(result[0]);

      return {
        is_success: false,
        error: {
          code: -1,
          message: "BOC Validation fault",
        },
      };
    }

    return {
      is_success: true,
      data: validatedBoc.boc,
    };
  }
}

function getValidatedBocResult(input: unknown): BocResult | null {
  if (!isStruct(input)) {
    return null;
  }

  if (typeof input.boc !== "string") {
    return null;
  }

  return {
    boc: input.boc,
  };
}
