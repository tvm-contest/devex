import { TonClient } from "@tonclient/core";
import TonContract from "./ton-contract";
import deployMultisig from "./parts/deploy-multisig";
import deployDemiurgeStore from "./parts/deploy-demiurge-store";
import { createClient } from "./utils/client";
import pkgGiver from "../ton-packages/Giver.package";
import pkgPadawan from "../ton-packages/Padawan.package";
import pkgProposal from "../ton-packages/Proposal.package";
import pkgTTW from "../ton-packages/TTW.package";
import pkgTestRoot from "../ton-packages/TestRoot.package";
import { utf8ToHex } from "./utils/convert";
import { trimlog } from "./utils/common";
import { sleep } from "./utils/common";
import { callThroughMultisig } from "./utils/net";
import deployDemiurge from "./parts/deploy-demiurge";
import deployToken from "./parts/deploy-token";

describe("Demiurge test", () => {
  let client: TonClient;
  let smcGiver: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcPadawan: TonContract;
  let smcProposal: TonContract;
  let smcSafeMultisigWallet: TonContract;
  let smcRT: TonContract;
  let smcTTWUser: TonContract;
  let smcTTWPadawan: TonContract;
  let smcTestRoot: TonContract;

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

  it("deploy and init Token", async () => {
    [smcRT, smcTTWUser] = await deployToken(client, smcGiver);
  });

  it("deploy and init Demiurge", async () => {
    smcDemiurge = await deployDemiurge(
      client,
      smcGiver,
      smcDemiurgeStore,
      smcTestRoot,
      smcRT
    );
  });

  it("deploy and init Padawan", async () => {
    const keys = await client.crypto.generate_random_sign_keys();

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployPadawan",
      input: {
        pubkey: `0x${keys.public}`,
      },
      dest: smcDemiurge.address,
      value: 5_000_000_000,
    });

    // TODO: refactor Padawan get
    smcPadawan = new TonContract({
      client,
      name: "Padawan",
      tonPackage: pkgPadawan,
      address: (Object.values(
        (await smcDemiurge.run({ functionName: "getDeployed" })).value.padawans
      )[0] as any).addr,
    });

    trimlog(`Padawan address: ${smcPadawan.address}
      Padawan balance: ${await smcPadawan.getBalance()}`);
  });

  it("set TTW to Padawan", async () => {
    console.log(
      (
        await smcPadawan.run({
          functionName: "getTokenAccounts",
        })
      ).value.allAccounts
    );

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "createTokenAccount",
      input: {},
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });

    const TTWAddr = (
      await smcPadawan.run({
        functionName: "getTokenAccounts",
      })
    ).value.allAccounts[smcRT.address].addr;

    smcTTWPadawan = new TonContract({
      client,
      name: "TTW",
      tonPackage: pkgTTW,
      address: TTWAddr,
    });
  });

  it("deposit tokens to account", async () => {
    const TOKEN_DEPOSIT = 16000000;

    console.log(
      (await smcPadawan.run({ functionName: "getDeposits" })).value.allDeposits
    );

    await smcTTWUser.call({
      functionName: "transfer",
      input: {
        dest: smcTTWPadawan.address,
        tokens: TOKEN_DEPOSIT,
        grams: 1_000_000_000,
      },
    });

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "depositTokens",
      input: {
        returnTo: smcTTWUser.address,
        tokenId: `0x${smcRT.address.substr(2)}`,
        tokens: TOKEN_DEPOSIT,
      },
      dest: smcPadawan.address,
      value: 2_000_000_000,
    });

    console.log(
      (await smcPadawan.run({ functionName: "getDeposits" })).value.allDeposits
    );

    console.log((await smcPadawan.run({ functionName: "getVoteInfo" })).value);
  });

  it("deploy and init Proposal", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deploySetCodeProposal",
      input: {
        start: Math.round(Date.now() / 1000) + 5,
        end: Math.round(Date.now() / 1000) + 180 + 60 * 60 * 7,
        title: utf8ToHex("test"),
        specific: {
          contractType: 1,
          code: "",
        },
      },
      dest: smcDemiurge.address,
      value: 5_000_000_000,
    });
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deploySetOwnerProposal",
      input: {
        start: Math.round(Date.now() / 1000) + 5,
        end: Math.round(Date.now() / 1000) + 180 + 60 * 60 * 7,
        title: utf8ToHex("test"),
        specific: {
          name: utf8ToHex("test"),
          ts: Math.round(Date.now() / 1000),
          owner:
            "0:e73840daf07b5bf9554e8b32dd7c880826f44e78b46b2cb5a288537505caf3c5",
        },
      },
      dest: smcDemiurge.address,
      value: 5_000_000_000,
    });
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deploySetRootOwnerProposal",
      input: {
        start: Math.round(Date.now() / 1000) + 5,
        end: Math.round(Date.now() / 1000) + 180 + 60 * 60 * 7,
        title: utf8ToHex("test"),
        specific: {
          pubkey:
            "0xb92d835085854943dcd7236e2bbb28d703fe6d0f074a61e8848559940b311aa0",
          comment: utf8ToHex("test"),
        },
      },
      dest: smcDemiurge.address,
      value: 5_000_000_000,
    });
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployReserveProposal",
      input: {
        start: Math.round(Date.now() / 1000) + 5,
        end: Math.round(Date.now() / 1000) + 180 + 60 * 60 * 7,
        title: utf8ToHex("test"),
        specific: {
          name: utf8ToHex("test"),
          ts: Math.round(Date.now() / 1000),
        },
      },
      dest: smcDemiurge.address,
      value: 5_000_000_000,
    });

    await sleep(5000);

    console.log(
      (await smcDemiurge.run({ functionName: "getDeployed" })).value.proposals
    );

    smcProposal = new TonContract({
      client,
      name: "Proposal",
      tonPackage: pkgProposal,
      address: Object.keys(
        (await smcDemiurge.run({ functionName: "getDeployed" })).value.proposals
      )[0],
    });

    trimlog(`Proposal address: ${smcProposal.address}
      Proposal balance: ${await smcProposal.getBalance()}`);
  });

  it("send votes for proposal", async () => {
    const VOTES_COUNT = 16000000;

    console.log(
      `Padawan vote info before: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes before: `,
      (await smcProposal.run({ functionName: "getCurrentVotes" })).value
    );

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "voteFor",
      input: {
        proposal: smcProposal.address,
        choice: true,
        votes: VOTES_COUNT,
      },
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });

    console.log(
      `Padawan vote info after: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes after: `,
      (await smcProposal.run({ functionName: "getCurrentVotes" })).value
    );
  });

  it("checks proposal result", async () => {
    console.log((await smcProposal.run({ functionName: "_t1" })).value);
    console.log((await smcProposal.run({ functionName: "_t2" })).value);
    console.log((await smcProposal.run({ functionName: "_t3" })).value);
    console.log((await smcProposal.run({ functionName: "_t4" })).value);
    console.log(
      (await smcProposal.run({ functionName: "getVotingResults" })).value
    );
    console.log(
      (await smcTestRoot.run({ functionName: "_proposalInfo" })).value
    );
    console.log((await smcTestRoot.run({ functionName: "_specific" })).value);

    console.log(
      `Padawan vote info: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
  });
});
