<script>
  import { Buffer } from 'buffer';
  import { onMount, getContext } from "svelte";
  import { Button } from "svelte-chota";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");

  export let element;
  let icon = "";
  let showIcon = false;
  let engine = getEngine();
  onMount(() => {
    element.setUsed();
    if (element.info.icon) {
      try {
        showIcon = true;
        icon = `data:;base64,${Buffer(element.info.icon, "hex").toString("base64")}`;
      } catch (e) {
        console.error('Cannot decode icon');
      }
    }
  })
 
  const launchDebot = () => {
    engine.start();
  }
</script>

<style>
  .icon {
    max-height: 55px;
  }
</style>

<div class="row">
  <div class="col-2 is-center">
    {#if showIcon}
      <img class="icon" src="{icon}" title="{element.info.name}" alt="{element.info.name}"/>
    {:else}
      <img class="icon" src="__CDN_URL__/assets/img/debot.png" title="{element.info.name}" alt="{element.info.name}"/>
    {/if}
  </div>
  <div class="col-10">
    <h3 style="margin: 0px;">{ element.info.name || i18n('debotInfo.untitled') } ({i18n('debotInfo.version')} { element.info.version })</h3>
    <p>{i18n('debotInfo.author')} { element.info.author || i18n('debotInfo.unknown') } | {i18n('debotInfo.language')} { element.info.language } | <a target="_blank" href="https://web.ton.surf/chat?cid={ element.info.support }">{i18n('debotInfo.support')}</a> </p>
  </div>
</div>
<p>{ element.info.hello }</p>
<Button on:click={launchDebot} disabled={element.isUsed} class="is-full-width">{i18n('debotInfo.launch')}</Button>