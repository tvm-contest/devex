import { TonClient } from "@tonclient/core";
import { libWeb, libWebSetup } from "@tonclient/lib-web";
import Debot from './components/Debot.svelte';
import { writable } from 'svelte/store';

// Application initialization
libWebSetup({
  binaryURL: '__CDN_URL__/tonclient.wasm',
});

TonClient.useBinaryLibrary(libWeb);

const loaded = writable(false);

window.addEventListener('load', () => {
  try{
    loaded.set(true);
  } catch (e) {
    console.log(e);
  }
});

let target = document.body;
if (window.debotBrowser) {
  target = document.getElementById(window.debotBrowser.targetElementId);
  target.innerHTML = "";
  loaded.set(true);
}

new Debot({
  target: target,
  props: {loaded}
});