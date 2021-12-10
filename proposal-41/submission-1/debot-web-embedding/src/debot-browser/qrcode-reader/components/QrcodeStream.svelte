<script>
  import { keepScanning } from "../misc/scanner.js";
  import Camera from "../misc/camera.js";
  import { onMount, onDestroy } from "svelte";

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let camera = "auto";
  export let torch = false;
  export let track;

  let destroyed = false;
  let cameraInstance = null;

  let pauseFrame, trackingLayer, video;

  onMount(async () => {
    await init();
  })

  onDestroy(() => {
    beforeResetCamera();
    destroyed = true;
  })

  const init = async () => {
    cameraInstance = await Camera(video, {
      camera: camera,
      torch: torch
    });

    if (destroyed === false && camera !== "off") {
      const canvas = pauseFrame;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      clearCanvas(pauseFrame);
      clearCanvas(trackingLayer);
      
      const detectHandler = (result) => {
        dispatch('detect', Promise.resolve(result));
      }

      keepScanning(video, {
        detectHandler,
        locateHandler: onLocate,
        minDelay: 40 // ~25 ffs
      })
    }
  };

  const beforeResetCamera = () => {
    if (cameraInstance !== null) {
      cameraInstance.stop();
      cameraInstance = null;
    }
  };

  const onLocate = (detectedCodes) => {
    const canvas = trackingLayer;

    if (canvas !== undefined) {
      if (detectedCodes.length > 0 && track !== undefined && video !== undefined) {
        // The visually occupied area of the video element.
        // Because the component is responsive and fills the available space,
        // this can be more or less than the actual resolution of the camera.
        const displayWidth = video.offsetWidth;
        const displayHeight = video.offsetHeight;

        // The actual resolution of the camera.
        // These values are fixed no matter the screen size.
        const resolutionWidth = video.videoWidth;
        const resolutionHeight = video.videoHeight;

        // Dimensions of the video element as if there would be no
        //   object-fit: cover;
        // Thus, the ratio is the same as the cameras resolution but it's
        // scaled down to the size of the visually occupied area.
        const largerRatio = Math.max(
          displayWidth / resolutionWidth,
          displayHeight / resolutionHeight
        );
        const uncutWidth = resolutionWidth * largerRatio;
        const uncutHeight = resolutionHeight * largerRatio;

        const xScalar = uncutWidth / resolutionWidth;
        const yScalar = uncutHeight / resolutionHeight;
        const xOffset = (displayWidth - uncutWidth) / 2;
        const yOffset = (displayHeight - uncutHeight) / 2;

        const scale = ({ x, y }) => {
          return {
            x: Math.floor(x * xScalar),
            y: Math.floor(y * yScalar)
          };
        }

        const translate = ({ x, y }) => {
          return {
            x: Math.floor(x + xOffset),
            y: Math.floor(y + yOffset)
          };
        }

        const adjustedCodes = detectedCodes.map(detectedCode => {
          const { boundingBox, cornerPoints } = detectedCode

          const { x, y } = translate(scale({
            x: boundingBox.x,
            y: boundingBox.y
          }))
          const { x: width, y: height } = scale({
            x: boundingBox.width,
            y: boundingBox.height
          })

          return {
            ...detectedCode,
            cornerPoints: cornerPoints.map(point => translate(scale(point))),
            boundingBox: DOMRectReadOnly.fromRect({ x, y, width, height })
          }
        });

        canvas.width = video.offsetWidth;
        canvas.height = video.offsetHeight;

        const ctx = canvas.getContext('2d');

        track(adjustedCodes, ctx);
      } else {
        clearCanvas(canvas);
      }
    }
  };

  const clearCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
</script>

<style>
  .qrcode-stream-wrapper {
    width: 100%;
    height: 100%;

    position: relative;
    z-index: 0;
  }

  .qrcode-stream-overlay {
    width: 100%;
    height: 100%;

    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }

  .second-layer {
    z-index: 1;
  }

  .qrcode-stream-camera {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    position: absolute;
    z-index: 2;
  }

  /* When a camera stream is loaded, we assign the stream to the `video`
  * element via `video.srcObject`. At this point the element used to be
  * hidden with `v-show="false"` aka. `display: none`. We do that because
  * at this point the videos dimensions are not known yet. We have to
  * wait for the `loadeddata` event first. Only after that event we
  * display the video element. Otherwise the elements size awkwardly flickers.
  *
  * However, it appears in iOS 15 all iOS browsers won't properly render
  * the video element if the `video.srcObject` was assigned *while* the
  * element was hidden with `display: none`. Using `visibility: hidden`
  * instead seems to have fixed the problem though.
  */
  .qrcode-stream-camera--hidden {
    visibility: hidden;
    position: absolute;
  }
</style>

<div class="qrcode-stream-wrapper">
  <!--
  Note, the following DOM elements are not styled with z-index.
  If z-index is not defined, elements are stacked in the order they appear in the DOM.
  The first element is at the very bottom and subsequent elements are added on top.
  -->
  <video
    bind:this={video}
    class="qrcode-stream-camera { !((destroyed === false && camera !== "off") && cameraInstance !== null) ? 'qrcode-stream-camera--hidden': '' }"
    autoplay
    muted
    playsinline
  ></video>

  {#if !(destroyed === false && camera !== "off" && cameraInstance !== null)}
    <canvas bind:this={pauseFrame} class="qrcode-stream-camera"></canvas>
  {/if}

  <canvas bind:this={trackingLayer} class="qrcode-stream-overlay"></canvas>

  <div class="is-center second-layer qrcode-stream-overlay">
    <slot></slot>
  </div>
</div>