import { RgResult } from "../../utils/result";

export type TonContractTokenCreatedEvent = {
  readonly addr: string;
};

export interface ITonRootContract {
  readonly address: string;

  getCollectionAddress(id: string): Promise<RgResult<string, unknown>>;
}
