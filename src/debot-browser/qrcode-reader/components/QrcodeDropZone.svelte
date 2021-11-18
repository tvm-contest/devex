<script>
  import { processFile, processUrl } from "../misc/scanner.js";
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  const onDrop = async (event) => {
    event.preventDefault();
    const { dataTransfer } = event;
    const droppedFiles = [...dataTransfer.files];
    const droppedUrl = dataTransfer.getData("text/uri-list");

    if (droppedFiles.length != 0) {
      dispatch("detect", droppedFiles.map(processFile));
    }

    if (droppedUrl !== "") {
      const decodedDroppedUrl = await processUrl(droppedUrl);
      dispatch("detect", decodedDroppedUrl);
    }
  }
</script>

<div on:drop={onDrop} ondragover="return false">
  <slot></slot>
</div>
