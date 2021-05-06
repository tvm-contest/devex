import { TonClient } from "@tonclient/core";
const { exec } = require("child_process");
import TonContract from "../ton-contract";
import pkgDemiurgeDebot from "../../ton-packages/DemiurgeDebot.package";
import pkgProposal from "../../ton-packages/Proposal.package";
import pkgPadawan from "../../ton-packages/Padawan.package";
import { trimlog } from "../utils/common";
const fs = require("fs");

export default async (
  client: TonClient,
  smcGiver: TonContract,
  smcDemiurge: TonContract
) => {
  const keys = await client.crypto.generate_random_sign_keys();
  const smcDemiurgeDebot = new TonContract({
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

  await smcGiver.call({
    functionName: "sendGrams",
    input: {
      dest: smcDemiurgeDebot.address,
      amount: 100_000_000_000,
    },
  });

  trimlog(`DemiurgeDebot balance: ${await smcDemiurgeDebot.getBalance()}`);

  await smcDemiurgeDebot.deploy({
    input: {
      demiurge: smcDemiurge.address,
    },
  });

  await new Promise<void>((resolve) => {
    fs.readFile(
      "./build/DemiurgeDebot.abi.json",
      "utf8",
      async function (err, data) {
        if (err) {
          return console.log({ err });
        }

        console.log(1);
        const buf = Buffer.from(data, "ascii");
        var hexvalue = buf.toString("hex");

        console.log(2);

        await smcDemiurgeDebot.call({
          functionName: "setABI",
          input: {
            dabi: hexvalue,
          },
        });

        console.log(3);

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
    `./bin/tonos-cli --url http://0.0.0.0 debot fetch ${smcDemiurgeDebot.address}`
  );

  return smcDemiurgeDebot;
};

// sabi=$(cat ../data/VotingDebot.abi.json | xxd -ps -c 20000)
// $tonoscli call $debot_address setVotingDebotABI "{\"sabi\":\"$sabi\"}" --sign $debot_keys --abi $debot_abi
// si=$(cat ../data/VotingDebot.tvc | base64 --wrap=0 )
// $tonoscli call $debot_address setVotingDebotImage "{\"image\":\"$si\"}" --sign $debot_keys --abi $debot_abi
// si=$(cat ../data/Proposal.tvc | base64 --wrap=0 )
// $tonoscli call $debot_address setProposalImage "{\"image\":\"$si\"}" --sign $debot_keys --abi $debot_abi
// si=$(cat ../data/Padawan.tvc | base64 --wrap=0 )
// $tonoscli call $debot_address setPadawanImage "{\"image\":\"$si\"}" --sign $debot_keys --abi $debot_abi
