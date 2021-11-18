<script>
  import { Buffer } from 'buffer';
  import { onMount, getContext } from "svelte";
  import { Field, Input, Button } from "svelte-chota";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let engine = getEngine();
  onMount(() => {
    element.setUsed();
  })

  const submit = () => {
    element.setUsed();
    engine.execute(element.answerId, engine.level, {value: Buffer(element.value).toString("hex")});
  }
</script>

<pre>{ element.title }</pre>
{#if element.multiline}
  <label for="textarea-{element.level}">{i18n('tag.input.value')}</label>
  <textarea id="textarea-{element.level}" disabled={element.isUsed} on:change={(event) => element.setValue(event.target.value)}></textarea>
  <Button disabled={element.isUsed} on:click={submit} primary class="is-full-width">{i18n('tag.input.apply')}</Button>
{:else}
  <label for="input-{element.level}">{i18n('tag.input.value')}</label>
  <Field gapless>
    <Input id="input-{element.level}" disabled={element.isUsed} on:change={(event) => element.setValue(event.target.value)}/>
    <Button disabled={element.isUsed} on:click={submit} primary>{i18n('tag.input.apply')}</Button>
  </Field>
{/if}