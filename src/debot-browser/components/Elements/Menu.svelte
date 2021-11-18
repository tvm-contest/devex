<script>
  import { onMount, getContext } from "svelte";
  import { Button } from "svelte-chota";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  let engine = getEngine();
  onMount(() => {
    element.setUsed();
  })

  const select = (choice, index) => {
    element.setUsed();
    engine.execute(choice.handlerId, engine.level, {index});
  }
</script>

<pre>{ element.title }</pre>
<ul class="menu-wrapper">
  {#each element.choices as choice, i}
    <li class="menu-points" data-key="{i}" on:click="{select(choice, i)}">
      <Button outline secondary class="is-full-width" disabled={element.isUsed}>
        <span class="text-bold">{choice.title}</span> {choice.description != "" ? `(${choice.description})`: ''}
      </Button>
    </li>
  {/each}
</ul>