import {
  ITonColContract,
  ITonColContractFactory,
  TonTokenContractGetColInfoResult, TonTokenContractGetTokenAddressResult,
} from "./ton-col-contract";

import * as fs from "fs";
import { RgResult } from "../../utils/result";

import { Abi, ResultOfRunTvm, TonClient } from "@tonclient/core";
import { isStruct } from "../../utils/utils";

const COL_ABI: Abi = {
  type: "Contract",
  value: JSON.parse(fs.readFileSync("./abi/Collection.abi.json", "utf-8")),
};

type ColInfoResult = {
  readonly id: string;
  readonly limit: string;
  readonly name: string;
  readonly creator: string;
  readonly symbol: string;
  readonly totalSupply: string;
  readonly creatorFees: string;
  readonly hash: string;
};

type TokenAddressResult = {
  readonly addr: string;
};

type BocResult = {
  readonly boc: string;
};

export class TonClientColContractFactory implements ITonColContractFactory {
  private readonly tonClient: TonClient;

  constructor(tonClient: TonClient) {
    this.tonClient = tonClient;
  }

  public getColContract(
    addr: string
  ): ITonColContract {
    return new TonClientColContract(this.tonClient, addr);
  }
}

export class TonClientColContract implements ITonColContract {
  private readonly tonClient: TonClient;
  private readonly address: string;

  constructor(tonClient: TonClient, address: string) {
    this.tonClient = tonClient;
    this.address = address;
  }

  public getAddress(): string {
    return this.address;
  }

  public async getTokenAddress(
    id1: string,
    id2: string,
    id3: string,
    id4: string,
    id5: string,
  ): Promise<RgResult<TonTokenContractGetTokenAddressResult, number>> {
    let result = await this.invoke(
      "getTokenAddress",
      {
        id1,
        id2,
        id3,
        id4,
        id5,
      }
    );

    while (!result.is_success && result.error.code === -1) {
      result = await this.invoke(
        "getTokenAddress",
        {
          id1,
          id2,
          id3,
          id4,
          id5,
        }
      );
    }

    if (!result.is_success) {
      return result;
    }

    const info = getValidatedTokenAddressResult(result.data);

    if (info === null) {
      console.log(
        "Response validation fault to getTokenAddress for address",
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
      data: info,
    };
  }

  public async getInfo(): Promise<RgResult<TonTokenContractGetColInfoResult, number>> {
    let result = await this.invoke("getInfo");

    while (!result.is_success && result.error.code === -1) {
      result = await this.invoke("getInfo");
    }

    if (!result.is_success) {
      return result;
    }

    const info = getValidatedColInfoResult(result.data);

    if (info === null) {
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
      data: info,
    };
  }

  private async invoke(
    functionName: string,
    input?: Record<any, any>
  ): Promise<RgResult<unknown, number>> {
    const bocResult = await this.getBoc();

    if (!bocResult.is_success) {
      return bocResult;
    }

    let result: ResultOfRunTvm;

    try {
      const encodedMessage = await this.tonClient.abi.encode_message({
        abi: COL_ABI,
        signer: {
          type: "None",
        },
        call_set: {
          function_name: functionName,
          input: input || {},
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
      abi: COL_ABI,
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

function getValidatedTokenAddressResult(input: unknown): TokenAddressResult | null {
  if (!isStruct(input)) {
    return null;
  }

  if (typeof input.addr !== "string") {
    return null;
  }

  return {
    addr: input.addr,
  };
}

function getValidatedColInfoResult(input: unknown): ColInfoResult | null {
  if (!isStruct(input)) {
    return null;
  }

  if (typeof input.name !== "string") {
    return null;
  }

  if (typeof input.symbol !== "string") {
    return null;
  }

  if (typeof input.creator !== "string") {
    return null;
  }

  if (typeof input.creatorFees !== "string") {
    return null;
  }

  if (typeof input.totalSupply !== "string") {
    return null;
  }

  if (typeof input.id !== "string") {
    return null;
  }

  if (typeof input.limit !== "string") {
    return null;
  }

  if (typeof input.hash !== "string") {
    return null;
  }

  return {
    name: input.name,
    symbol: input.symbol,
    creator: input.creator,
    creatorFees: input.creatorFees,
    totalSupply: input.totalSupply,
    limit: input.limit,
    id: input.id,
    hash: input.hash,
  };
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
