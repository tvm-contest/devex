<script>
  import { Buffer } from 'buffer';
  import { onMount, getContext } from "svelte";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  let error;
  
  let engine = getEngine();
  onMount(async () => {
    element.setUsed();
    let input = "";
    if (element.method.type == "encode") {
      input = Buffer(element.method.data).toString("hex");
    }
    if (element.method.type == "decode") {
      input = Buffer(element.method.data, "hex").toString();
    }
    engine.execute(element.answerId, engine.level, input);
  });
</script>

{#if error}
  <p>
    {error}
  </p>
{/if}