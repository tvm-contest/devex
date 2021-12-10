import EmbedTool from './components/EmbedTool.svelte';
import { writable } from 'svelte/store';

const loaded = writable(false);

window.addEventListener('load', (event) => {
  try{
    loaded.set(true);
  } catch (e) {
    console.log(e);
  }
});

new EmbedTool({
  target: document.body,
  props: {loaded}
});