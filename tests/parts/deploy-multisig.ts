import { TonClient } from "@tonclient/core";
import TonContract from "../ton-contract";
import pkgSafeMultisigWallet from "../../ton-packages/SafeMultisigWallet.package";
import { trimlog } from "../utils/common";
const fs = require("fs");

export default async (client: TonClient, smcGiver: TonContract) => {
  const keys = await client.crypto.generate_random_sign_keys();
  const smcSafeMultisigWallet = new TonContract({
    client,
    name: "SafeMultisigWallet",
    tonPackage: pkgSafeMultisigWallet,
    keys,
  });

  fs.writeFileSync("./keys.json", JSON.stringify(keys));

  await smcSafeMultisigWallet.calcAddress();

  await smcGiver.call({
    functionName: "sendGrams",
    input: {
      dest: smcSafeMultisigWallet.address,
      amount: 100_000_000_000,
    },
  });

  trimlog(`SafeMultisigWallet address: ${smcSafeMultisigWallet.address}
    SafeMultisigWallet public: ${smcSafeMultisigWallet.keys.public}
    SafeMultisigWallet secret: ${smcSafeMultisigWallet.keys.secret}
    SafeMultisigWallet balance: ${await smcSafeMultisigWallet.getBalance()}`);

  await smcSafeMultisigWallet.deploy({
    input: {
      owners: [`0x${smcSafeMultisigWallet.keys.public}`],
      reqConfirms: 1,
    },
  });

  return smcSafeMultisigWallet;
};
