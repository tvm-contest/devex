<script>
  import { Button } from "svelte-chota";
  import { getContext } from "svelte";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let engine = getEngine();

  const cancel = () => {
    element.setUsed();
    engine.execute(element.answerId, engine.level, {value: false});
  }
  
  const confirm = () => {
    element.setUsed();
    engine.execute(element.answerId, engine.level, {value: true});
  }
</script>

<div>{ element.title }</div>
<div class="is-center">
  <Button on:click="{cancel}" error disabled={element.isUsed}>{i18n('tag.inputConfirm.cancel')}</Button>
  <Button on:click="{confirm}" success disabled={element.isUsed}>{i18n('tag.inputConfirm.confirm')}</Button>
</div>