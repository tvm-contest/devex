<script>
  import BN from "bignumber.js";
  import { Field, Input, Button } from "svelte-chota";
  import { onMount, getContext } from "svelte";
  import i18n from "./../i18n.js";
  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let engine = getEngine();

  const submit = () => {
    if (valid) {
      element.setUsed();
      engine.execute(element.answerId, engine.level, {value: element.value});
    }
  }

  let node;
  let invalid = true;

  onMount(() => {
    node = document.getElementById("value-" + element.level);
  });
  
  const valid = (amount) => {
    let failed = false;
    if (BN(amount).lte(BN(element.min))) {
      failed = true;
      node.setCustomValidity(i18n("validation.gte", [element.min]));
    }

    if (BN(amount).gte(BN(element.max))) {
      failed = true;
      node.setCustomValidity(i18n("validation.lte", [element.max]));
    }

    const scaledAmount = BN(amount).multipliedBy(BN('10').exponentiatedBy(BN(element.decimals)));
    if (!scaledAmount.isInteger()) {
      failed = true;
      node.setCustomValidity(i18n("validation.scale"));
    }

    if (!failed) {
      node.setCustomValidity("");
    }
    node.reportValidity();

    invalid = failed;
    return !failed;
  }
</script>

<span>{ element.title }</span>
<Field gapless>
  <Input id="value-{element.level}" on:keyup={(event) => {valid(event.target.value); element.setValue(event.target.value)} } required disabled="{element.isUsed}" type="number"/>
  <Button on:click={submit} disabled={element.isUsed || invalid} class="primary">{i18n('tag.inputAmount.apply')}</Button>
</Field>