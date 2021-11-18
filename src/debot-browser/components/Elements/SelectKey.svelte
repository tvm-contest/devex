<script>
  import { getContext } from "svelte";
  import { Button } from "svelte-chota";
  import SigningBoxClass from "./../../lib/SigningBox";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  let error;

  let engine = getEngine();

  const useTonCrystalWallet = async () => {
    error = "";
    try {
      if (typeof window.hasTonProvider === 'undefined') {
        error = 'TON Crystal wallet extension is not available, please install.';
        return;
      }
     
      const response = await window.ton.request({"method": "requestPermissions", "params": {permissions: ['tonClient', 'accountInteraction']}});

      if (response == null || response.accountInteraction == null) {
        error = 'Insufficient permissions';
        return;
      }

      const publicKey = response.accountInteraction.publicKey;
      const address = response.accountInteraction.address;
      const signer = async (unsigned) => {
        const result = await window.ton.request({"method": "signDataRaw", "params": { publicKey, data: unsigned }});
        return {signature: result.signatureHex};
      };
      const SigningBox = new SigningBoxClass(publicKey, signer);
      const SigningBoxHandle = (await engine.client.crypto.register_signing_box(SigningBox)).handle;
      element.setUsed();
      const sg = { signing_box: SigningBoxHandle };
      engine.setSigningBox(sg);
      engine.setAccount({address, publicKey});
      element.resolve(sg);
    } catch (e) {
      error = i18n('tag.selectKey.unknownError');
    }
  }
</script>

<div>{i18n('tag.selectKey.title')}</div>

<div class="is-center">
  <Button size="3" on:click={(() => {useTonCrystalWallet()})} disabled={element.isUsed} class="is-rounded" title="TON crystal" icon="__CDN_URL__/assets/img/ton-crystal-wallet.svg"/>
</div>
{#if error}
  <div class="error">{ error }</div>
{/if}