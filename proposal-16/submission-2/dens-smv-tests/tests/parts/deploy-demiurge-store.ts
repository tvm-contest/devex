import { TonClient } from "@tonclient/core";
import TonContract from "../ton-contract";
import pkgDemiurgeStore from "../../ton-packages/DemiurgeStore.package";
import pkgPadawan from "../../ton-packages/Padawan.package";
import pkgProposal from "../../ton-packages/Proposal.package";
import pkgDemiurge from "../../ton-packages/Demiurge.package";
import { trimlog } from "../utils/common";

export default async (client: TonClient, smcNSEGiver: TonContract) => {
  const smcDemiurgeStore = new TonContract({
    client,
    name: "DemiurgeStore",
    tonPackage: pkgDemiurgeStore,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcDemiurgeStore.calcAddress();

  await smcNSEGiver.call({
    functionName: "sendGrams",
    input: {
      dest: smcDemiurgeStore.address,
      amount: 100_000_000_000,
    },
  });

  trimlog(`DemiurgeStore address: ${smcDemiurgeStore.address}
    DemiurgeStore public: ${smcDemiurgeStore.keys.public}
    DemiurgeStore secret: ${smcDemiurgeStore.keys.secret}
    DemiurgeStore balance: ${await smcDemiurgeStore.getBalance()}`);

  await smcDemiurgeStore.deploy();

  await smcDemiurgeStore.call({
    functionName: "setDemiurgeImage",
    input: { image: pkgDemiurge.image },
  });
  await smcDemiurgeStore.call({
    functionName: "setProposalImage",
    input: { image: pkgProposal.image },
  });
  await smcDemiurgeStore.call({
    functionName: "setPadawanImage",
    input: { image: pkgPadawan.image },
  });

  // TODO: add images check

  return smcDemiurgeStore;
};
