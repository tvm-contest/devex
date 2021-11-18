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
    let config = {
        method: element.method.toUpperCase(),
        headers: element.headers
    };

    if (element.body !== null) {
      config.body = element.body;
    }

    const response = await fetch(element.url, config);
    let retHeaders = [];
    const entries = Object.entries(response.headers);
    entries.forEach(([key, value]) => {
      retHeaders.push(Buffer(`${key}: ${value}`).toString("hex"))
    });

    const data = await response.text();
    const input = {
      statusCode: response.status,
      content: Buffer(data).toString("hex"),
      retHeaders,
    };
    engine.execute(element.answerId, engine.level, input);
  });
</script>

{#if error}
  <p>
    {error}
  </p>
{/if}