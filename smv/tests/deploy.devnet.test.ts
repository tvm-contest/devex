import { TonClient } from "@tonclient/core";
import TonContract from "./ton-contract";
import deployMultisig from "./parts/deploy-multisig";
import deployDemiurgeStore from "./parts/deploy-demiurge-store";
import { createClient } from "./utils/client";
import pkgGiver from "../ton-packages/Giver.package";
import pkgDemiurgeDebot from "../ton-packages/DemiurgeDebot.package";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import pkgProposal from "../ton-packages/Proposal.package";
import pkgDemiurgeStore from "../ton-packages/DemiurgeStore.package";
import pkgTestRoot from "../ton-packages/TestRoot.package";
import pkgDemiurge from "../ton-packages/Demiurge.package";
import pkgPadawan from "../ton-packages/Padawan.package";
import { utf8ToHex } from "./utils/convert";
import { trimlog } from "./utils/common";
import { sleep } from "./utils/common";
import { callThroughMultisig } from "./utils/net";
import deployDemiurge from "./parts/deploy-demiurge";
import deployToken from "./parts/deploy-token";
const fs = require("fs");

describe("Demiurge test", () => {
  let client: TonClient;
  let smcGiver: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcSafeMultisigWallet: TonContract;
  let smcDemiurgeDebot: TonContract;
  let smcTestRoot: TonContract;

  console.log(process.env.NETWORK);

  before(async () => {
    client = createClient();
    smcGiver = new TonContract({
      client,
      name: "Giver",
      tonPackage: pkgGiver,
      address: process.env.GIVER_ADDRESS,
    });

    smcSafeMultisigWallet = new TonContract({
      client,
      name: "SafeMultisigWallet",
      tonPackage: pkgSafeMultisigWallet,
      address: process.env.SAFE_MULTISIG_WALLET_ADDRESS,
      keys: {
        public: process.env.SAFE_MULTISIG_WALLET_PUBLIC,
        secret: process.env.SAFE_MULTISIG_WALLET_SECRET,
      },
    });
  });

  it("deploy TestRoot", async () => {
    smcTestRoot = new TonContract({
      client,
      name: "TestRoot",
      tonPackage: pkgTestRoot,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    await smcTestRoot.calcAddress();

    await smcSafeMultisigWallet.call({
      functionName: "sendTransaction",
      input: {
        dest: smcTestRoot.address,
        value: 1000000000,
        flags: 3,
        bounce: false,
        payload: "",
      },
    });

    trimlog(`TestRoot address: ${smcTestRoot.address}
      TestRoot public: ${smcTestRoot.keys.public}
      TestRoot secret: ${smcTestRoot.keys.secret}
      TestRoot balance: ${await smcTestRoot.getBalance()}`);

    await smcTestRoot.deploy();
  });

  it("deploy DemiurgeStore", async () => {
    smcDemiurgeStore = new TonContract({
      client,
      name: "DemiurgeStore",
      tonPackage: pkgDemiurgeStore,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    await smcDemiurgeStore.calcAddress();

    await smcSafeMultisigWallet.call({
      functionName: "sendTransaction",
      input: {
        dest: smcDemiurgeStore.address,
        value: 100_000_000_000,
        flags: 3,
        bounce: false,
        payload: "",
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
  });

  it("deploy DemiurgeStore", async () => {
    smcDemiurge = new TonContract({
      client,
      name: "Demiurge",
      tonPackage: pkgDemiurge,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    await smcDemiurge.calcAddress();

    await smcSafeMultisigWallet.call({
      functionName: "sendTransaction",
      input: {
        dest: smcDemiurge.address,
        value: 100_000_000_000,
        flags: 3,
        bounce: false,
        payload: "",
      },
    });

    await smcDemiurge.deploy({
      input: {
        store: smcDemiurgeStore.address,
        densRoot: smcTestRoot.address,
        tokenRoot: process.env.TIP3,
      },
    });

    trimlog(`Demiurge address: ${smcDemiurge.address}
      Demiurge public: ${smcDemiurge.keys.public}
      Demiurge secret: ${smcDemiurge.keys.secret}
      Demiurge balance: ${await smcDemiurge.getBalance()}`);

    await sleep(15000);
  });

  it("deploy DemiurgeDebot", async () => {
    const keys = await client.crypto.generate_random_sign_keys();
    smcDemiurgeDebot = new TonContract({
      client,
      name: "DemiurgeDebot",
      tonPackage: pkgDemiurgeDebot,
      keys,
    });
    fs.writeFileSync("./debot-keys.json", JSON.stringify(keys));

    await smcDemiurgeDebot.calcAddress();

    trimlog(`DemiurgeDebot address: ${smcDemiurgeDebot.address},
      DemiurgeDebot public: ${smcDemiurgeDebot.keys.public},
      DemiurgeDebot secret: ${smcDemiurgeDebot.keys.secret}`);

    await smcSafeMultisigWallet.call({
      functionName: "sendTransaction",
      input: {
        dest: smcDemiurgeDebot.address,
        value: 100_000_000_000,
        flags: 3,
        bounce: false,
        payload: "",
      },
    });

    trimlog(`DemiurgeDebot balance: ${await smcDemiurgeDebot.getBalance()}`);

    await smcDemiurgeDebot.deploy({
      input: {
        demiurge: smcDemiurge.address,
      },
    });

    console.log("Deployed!");

    await new Promise<void>((resolve) => {
      fs.readFile(
        "./build/DemiurgeDebot.abi.json",
        "utf8",
        async function (err, data) {
          if (err) {
            return console.log({ err });
          }

          const buf = Buffer.from(data, "ascii");
          var hexvalue = buf.toString("hex");

          await smcDemiurgeDebot.call({
            functionName: "setABI",
            input: {
              dabi: hexvalue,
            },
          });

          resolve();
        }
      );
    });

    await smcDemiurgeDebot.call({
      functionName: "setProposalImage",
      input: {
        image: pkgProposal.image,
      },
    });

    await smcDemiurgeDebot.call({
      functionName: "setPadawanImage",
      input: {
        image: pkgPadawan.image,
      },
    });

    console.log(
      `./bin/tonos-cli --url http://net.ton.dev debot fetch ${smcDemiurgeDebot.address}`
    );
  });
});
