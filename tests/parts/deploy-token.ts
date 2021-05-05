import { TonClient } from "@tonclient/core";
import TonContract from "../ton-contract";
import pkgRT from "../../ton-packages/RT.package";
import pkgTTW from "../../ton-packages/TTW.package";
import { sleep, trimlog } from "../utils/common";
import { utf8ToHex } from "../utils/convert";

export default async (client: TonClient, smcGiver: TonContract) => {
  const smcRT = new TonContract({
    client,
    name: "RT",
    tonPackage: pkgRT,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcRT.calcAddress();

  await smcGiver.call({
    functionName: "sendGrams",
    input: { amount: 10_000_000_000, dest: smcRT.address },
  });

  await smcRT.deploy({
    input: {
      name: utf8ToHex("tip3"),
      symbol: utf8ToHex("TP3"),
      decimals: 0,
      root_public_key: `0x${smcRT.keys.public}`,
      root_owner: "0x0",
      wallet_code: (await client.boc.get_code_from_tvc({ tvc: pkgTTW.image }))
        .code,
      total_supply: 21000000,
    },
  });

  trimlog(`RT address: ${smcRT.address}
    RT public: ${smcRT.keys.public}
    RT secret: ${smcRT.keys.secret}
    RT balance: ${await smcRT.getBalance()}`);

  const smcTTW = new TonContract({
    client,
    name: "TTW",
    tonPackage: pkgTTW,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  const deployTTWResult = await smcRT.call({
    functionName: "deployWallet",
    input: {
      _answer_id: 1,
      workchain_id: 0,
      pubkey: `0x${smcTTW.keys.public}`,
      internal_owner: 0,
      tokens: 17000000,
      grams: 5_000_000_000,
    },
  });

  smcTTW.address = deployTTWResult.decoded.output.value0;

  trimlog(`TTW address: ${smcTTW.address}
    TTW public: ${smcTTW.keys.public}
    TTW secret: ${smcTTW.keys.secret}
    TTW balance: ${await smcTTW.getBalance()}`);

  // TODO: add waiting

  await sleep(1000);

  return [smcRT, smcTTW];
};
