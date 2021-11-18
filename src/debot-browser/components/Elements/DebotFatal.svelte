<script>
  import { getContext } from "svelte";
  import { Button } from "svelte-chota";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  let engine = getEngine();

  const refresh = () => {
    engine.refresh();
  }
</script>

<h5>{i18n('tag.fatal.error')}</h5>
<p>
  { element.exception.message }
</p>
<Button on:click={refresh} class="primary">{i18n('tag.fatal.refresh')}</Button>