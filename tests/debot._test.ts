import { TonClient } from "@tonclient/core";
import { createClient } from "./utils/client";
import TonContract from "./ton-contract";
import pkgGiver from "../ton-packages/Giver.package";
import pkgTestRoot from "../ton-packages/TestRoot.package";
import pkgProposal from "../ton-packages/Proposal.package";
import deployMultisig from "./parts/deploy-multisig";
import { sleep, trimlog } from "./utils/common";
import deployDemiurgeStore from "./parts/deploy-demiurge-store";
import deployDemiurge from "./parts/deploy-demiurge";
import deployToken from "./parts/deploy-token";
import deployDebot from "./parts/deploy-debot";
import { callThroughMultisig } from "./utils/net";
import { utf8ToHex } from "./utils/convert";

describe("nic expiring test", () => {
  let client: TonClient;
  let smcGiver: TonContract;
  let smcSafeMultisigWallet: TonContract;
  let smcTestRoot: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcRT: TonContract;
  let smcTTWUser: TonContract;
  let smcDeBot: TonContract;
  let smcProposal: TonContract;

  before(async () => {
    client = createClient();
    smcGiver = new TonContract({
      client,
      name: "Giver",
      tonPackage: pkgGiver,
      address: process.env.GIVER_ADDRESS,
    });
  });

  it("deploy SafeMultisigWallet", async () => {
    smcSafeMultisigWallet = await deployMultisig(client, smcGiver);
  });

  it("deploy TestRoot", async () => {
    smcTestRoot = new TonContract({
      client,
      name: "TestRoot",
      tonPackage: pkgTestRoot,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    await smcTestRoot.calcAddress();

    await smcGiver.call({
      functionName: "sendGrams",
      input: {
        dest: smcTestRoot.address,
        amount: 100_000_000_000,
      },
    });

    trimlog(`TestRoot address: ${smcTestRoot.address}
      TestRoot public: ${smcTestRoot.keys.public}
      TestRoot secret: ${smcTestRoot.keys.secret}
      TestRoot balance: ${await smcTestRoot.getBalance()}`);

    await smcTestRoot.deploy();
  });

  it("deploy and init DemiurgeStore", async () => {
    smcDemiurgeStore = await deployDemiurgeStore(client, smcGiver);
  });

  it("deploy and init Demiurge", async () => {
    smcDemiurge = await deployDemiurge(
      client,
      smcGiver,
      smcDemiurgeStore,
      smcTestRoot
    );
  });

  it("deploy and init Token", async () => {
    [smcRT, smcTTWUser] = await deployToken(client, smcGiver);
  });

  // it("deploy and init Proposal", async () => {
  //   await callThroughMultisig({
  //     client,
  //     smcSafeMultisigWallet,
  //     abi: smcDemiurge.tonPackage.abi,
  //     functionName: "deployReserveProposal",
  //     input: {
  //       start: Math.round(Date.now() / 1000) + 5,
  //       end: Math.round(Date.now() / 1000) + 180 + 60 * 60 * 7,
  //       title: utf8ToHex("test"),
  //       specific: {
  //         name: utf8ToHex("test"),
  //         ts: Math.round(Date.now() / 1000),
  //       },
  //     },
  //     dest: smcDemiurge.address,
  //     value: 5_000_000_000,
  //   });

  //   await sleep(5000);

  //   smcProposal = new TonContract({
  //     client,
  //     name: "Proposal",
  //     tonPackage: pkgProposal,
  //     address: Object.keys(
  //       (await smcDemiurge.run({ functionName: "getDeployed" })).value.proposals
  //     )[0],
  //   });

  //   trimlog(`Proposal address: ${smcProposal.address}
  //     Proposal balance: ${await smcProposal.getBalance()}`);
  // });

  it("deploy DeBot", async () => {
    smcDeBot = await deployDebot(client, smcGiver);
  });
});
