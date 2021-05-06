import { TonClient } from "@tonclient/core";
import TonContract from "../ton-contract";
import pkgDemiurge from "../../ton-packages/Demiurge.package";
import { sleep, trimlog } from "../utils/common";
import { waitForMessage } from "../utils/net";

export default async (
  client: TonClient,
  smcGiver: TonContract,
  smcDemiurgeStore: TonContract,
  smcTestRoot: TonContract,
  smcRT: TonContract
) => {
  const smcDemiurge = new TonContract({
    client,
    name: "Demiurge",
    tonPackage: pkgDemiurge,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcDemiurge.calcAddress();

  await smcGiver.call({
    functionName: "sendGrams",
    input: {
      dest: smcDemiurge.address,
      amount: 100_000_000_000,
    },
  });

  await smcDemiurge.deploy({
    input: {
      store: smcDemiurgeStore.address,
      densRoot: smcTestRoot.address,
      tokenRoot: smcRT.address,
    },
  });

  trimlog(`Demiurge address: ${smcDemiurge.address}
    Demiurge public: ${smcDemiurge.keys.public}
    Demiurge secret: ${smcDemiurge.keys.secret}
    Demiurge balance: ${await smcDemiurge.getBalance()}`);

  // TODO: add waiting

  await sleep(1000);

  return smcDemiurge;
};
