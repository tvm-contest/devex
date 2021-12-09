import { RgResult } from "../../utils/result";

export type TonTokenContractGetTradeInfoResult = {
  readonly owner: string;
  readonly creator: string;
  readonly creatorFees: string;
  readonly manager: string;
  readonly managerUnlockTime: string;
};

export interface ITonTokenContract {
  getAddress(): string;

  getTradeInfo(): Promise<RgResult<TonTokenContractGetTradeInfoResult>>;
}

export interface ITonTokenContractFactory {
  getTokenContract(addr: string): ITonTokenContract;
}
