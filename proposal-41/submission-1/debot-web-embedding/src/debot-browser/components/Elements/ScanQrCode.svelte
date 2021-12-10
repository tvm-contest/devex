<script>
  import { Buffer } from 'buffer';
  import { Button } from "svelte-chota";
  import { onMount, getContext } from "svelte";
  import { QrcodeDropZone, QrcodeCapture, QrcodeStream } from "./../../qrcode-reader";
  import i18n from "./../i18n.js";

  //Context
  const { getEngine } = getContext("app_functions");
  export let element;
  
  let error = "";
  let upload;
  let cameraDialog = false;
  let cameraInited = false;

  let engine = getEngine();
  onMount(() => {
    upload = document.getElementById("upload");
  })

  const onDetect = async (event) => {
    if (!element.isUsed) {
      try {
        let QrCodePromise;
        if (Array.isArray(event.detail)) {
          QrCodePromise = event.detail[0];
        } else {
          QrCodePromise = event.detail;
        }
        const { content } = await QrCodePromise;
        if (null === content) {
          error = i18n('tag.scanQrCode.couldNotRecognize');
        } else {
          element.setUsed();
          engine.execute(element.answerId, engine.level, {value: Buffer(content).toString("hex")});
        }
        cameraDialog = false;
        cameraInited = false;
      } catch (err) {
        error = i18n('tag.scanQrCode.error', err.message);
      }
    }
  }
</script>

<style>
  .dropArea {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    width: 100%;
    align-items: center;
    height: 300px;
    border: 3px dashed var(--debot-browser-color-darkGrey)
  }
  
  .dropArea__buttons {
    display: flex;
    justify-content: space-evenly;
    width: 100%;
  }

  .drop-error {
    color: red;
    font-weight: bold;
  }

  .qrcode-wrapper {
    position: relative;
  }

  .qrcode-stream-wrapper {
    position: absolute;
    height: calc(100% - 2.3em);
    width: 100%;
    top: 0px;
    left: 0px;
    z-index: 9999;
    background: var(--debot-browser-bg-color);
  }
</style>

<div class="qrcode-wrapper">
  <div>{i18n('tag.scanQrCode.title')}</div>
  {#if cameraDialog}
    <div class="qrcode-stream-wrapper">
      <QrcodeStream on:detect={onDetect}>
        {#if !cameraInited}
          <div>{i18n('tag.scanQrCode.allowCamera')}</div>
        {/if}
      </QrcodeStream>
      <Button on:click={() => {cameraDialog = false}} class="is-full-width">{i18n('tag.scanQrCode.cancel')}</Button>
    </div>
  {/if}
  <QrcodeCapture on:detect={onDetect} multiple="false" id="upload"/>
  <QrcodeDropZone on:detect={onDetect}>
    <div class="dropArea">
      <div>{i18n('tag.scanQrCode.drop')}</div>
      <div class="dropArea__buttons">
        <Button on:click={() => {upload.click()}} disabled={element.isUsed} primary outer>{i18n('tag.scanQrCode.upload')}</Button>
        <div>{i18n('tag.scanQrCode.or')}</div>
        <Button on:click={() => {cameraDialog = true}} disabled={element.isUsed} primary outer>{i18n('tag.scanQrCode.scan')}</Button>
      </div>
    </div>
  </QrcodeDropZone>
  {#if error != ""}
    <div class="drop-error">{error}</div>
  {/if}
</div>