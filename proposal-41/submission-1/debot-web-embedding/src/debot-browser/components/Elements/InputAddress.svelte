<script>
  import { Field, Input, Button } from "svelte-chota";
  import { onMount, getContext } from "svelte";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let engine = getEngine();

  let defaultValue = "";
  onMount(() => {
    if (engine.account != null) {
      defaultValue = engine.account.address;
      valid = true;
      element.setValue(defaultValue);
    }
  })

  let valid = false;
  const onchage = (event) => {
    valid = event.target.validity.valid;
    element.setValue(event.target.value);
  }

  const submit = () => {
    element.setUsed();
    engine.execute(element.answerId, engine.level, {value: element.value});
  }
</script>

<div>{ element.title }</div>
<Field gapless>
  <Input pattern="{"^-?[0-9]+:[a-f0-9]{64}$"}" value={defaultValue} on:keyup={onchage} required disabled="{element.isUsed}" />
  <Button disabled="{element.isUsed || !valid}" on:click={submit} type="submit" class="primary small">{i18n('tag.inputAddress.apply')}</Button>
</Field>
