<script>
  import { onMount, getContext } from "svelte";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let engine = getEngine();
  
  onMount(() => {
    element.setUsed();
    if (element.answerId !== '0') {
      engine.execute(element.answerId, engine.level);
    }
  })
</script>

<div>{ element.prompt }</div>
<img src="{element.data}" alt="{element.prompt}"/>