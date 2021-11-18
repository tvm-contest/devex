<script>
  import { processFile } from "../misc/scanner.js";
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let multiple, id;

  const onChangeInput = (event) => {
    const files = [...event.target.files];
    dispatch('detect', files.map(processFile));
  };
</script>

<style>
  .uploadInput {
    display: none !important;
  }
</style>

<input
  on:change="{onChangeInput}"
  type="file"
  name="image"
  accept="image/*"
  capture="environment"
  {multiple}
  {id}
  class="uploadInput"
/>
