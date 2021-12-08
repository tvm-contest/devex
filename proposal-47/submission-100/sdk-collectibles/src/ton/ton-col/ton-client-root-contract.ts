import { Abi, ResultOfRunTvm, TonClient } from "@tonclient/core";

import * as fs from "fs";
import { isStruct } from "../../utils/utils";
import { RgResult } from "../../utils/result";

import { ITonRootContract } from "./ton-root-contract";

const COL_ROOT_ABI: Abi = {
  type: "Contract",
  value: JSON.parse(fs.readFileSync("./abi/CollectionRoot.abi.json", "utf-8")),
};

type BocResult = {
  readonly boc: string;
};

type GetTokenAddressResult = {
  readonly addr: string;
};

export class TonClientRootContract implements ITonRootContract {
  constructor(
    private readonly tonClient: TonClient,
    public readonly address: string
  ) {}

  public async getCollectionAddress(
    tokenId: string
  ): Promise<RgResult<string, unknown>> {
    const result = await this.invoke("getCollectionAddress", { id: tokenId });

    if (!result.is_success) {
      return result;
    }

    const info = getValidatedCollectionAddressResult(result.data);

    if (info === null) {
      console.log(
        "Response validation fault to getCollectionAddress for root contract"
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
      data: info.addr,
    };
  }

  private async invoke(
    functionName: string,
    input: unknown
  ): Promise<RgResult<unknown>> {
    const bocResult = await this.getBoc();

    if (!bocResult.is_success) {
      return bocResult;
    }

    let result: ResultOfRunTvm;

    try {
      const encodedMessage = await this.tonClient.abi.encode_message({
        abi: COL_ROOT_ABI,
        signer: {
          type: "None",
        },
        call_set: {
          function_name: functionName,
          input,
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
      abi: COL_ROOT_ABI,
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

  private async getBoc(address?: string): Promise<RgResult<string>> {
    let result: unknown[];

    try {
      const queryCollectionResult = await this.tonClient.net.query_collection({
        collection: "accounts",
        filter: {
          id: { eq: address || this.address },
        },
        result: "boc",
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
      console.log("Validation fault for attempt to get BOC for root contract");
      console.log(result[0]);

      return {
        is_success: false,
        error: {
          code: -1,
          message: "BOC Validation Fault",
        },
      };
    }

    return {
      is_success: true,
      data: validatedBoc.boc,
    };
  }
}

function getValidatedCollectionAddressResult(
  input: unknown
): GetTokenAddressResult | null {
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
