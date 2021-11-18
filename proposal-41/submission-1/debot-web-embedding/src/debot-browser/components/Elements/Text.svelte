<script>
  import { onMount, getContext } from "svelte";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let engine = getEngine();
  onMount(() => {
    element.setUsed();
    if ('0' !== element.answerId) {
      engine.execute(element.answerId, engine.level);
    }
  })
</script>
<style>
  .empty {
    display: none !important;
  }
  .text {
    white-space: pre-line;
  }
</style>

<div class="{element.text == '' ? 'empty': ''}">
  <div class="text">
    { element.text }
  </div>
</div>