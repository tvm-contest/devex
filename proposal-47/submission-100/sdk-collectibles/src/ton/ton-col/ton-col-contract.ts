import { RgResult } from "../../utils/result";

export type TonTokenContractGetColInfoResult = {
  readonly id: string;
  readonly limit: string;
  readonly name: string;
  readonly creator: string;
  readonly symbol: string;
  readonly hash: string;
  readonly totalSupply: string;
  readonly creatorFees: string;
};

export type TonTokenContractGetTokenAddressResult = {
  readonly addr: string;
};

export interface ITonColContract {
  getAddress(): string;

  getInfo(): Promise<RgResult<TonTokenContractGetColInfoResult>>;
  
  getTokenAddress(
      id1: string,
      id2: string,
      id3: string,
      id4: string,
      id5: string,
  ): Promise<RgResult<TonTokenContractGetTokenAddressResult>>;
}

export interface ITonColContractFactory {
  getColContract(addr: string): ITonColContract;
}
