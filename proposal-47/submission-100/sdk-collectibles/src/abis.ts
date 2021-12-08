import { Abi } from "@tonclient/core";
import { readFileSync } from "fs";

const ABI_FILES = [
  "Collection",
  "CollectionRoot",
  "CollectionToken",
  "msig"
] as const;

export type AbiFileName = typeof ABI_FILES[number];

export class Abis {
  private abis: Record<AbiFileName, Abi>;

  constructor() {
    const abis = <Record<AbiFileName, Abi>> {};

    for (const abiFileName of ABI_FILES) {
      const abi: Abi = {
        type: "Contract",
        value: JSON.parse(readFileSync("./abi/" + abiFileName + ".abi.json", "utf-8")),
      };

      abis[abiFileName] = abi;
    }

    this.abis = abis;
  }

  public get(name: AbiFileName): Abi {
    return this.abis[name];
  }
}
