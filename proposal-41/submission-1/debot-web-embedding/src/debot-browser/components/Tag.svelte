<script>
  import DebotInfo from "./Elements/DebotInfo.svelte";
  import DebotFatal from "./Elements/DebotFatal.svelte";

  import DebotText from "./Elements/Text.svelte";
  import DebotMenu from "./Elements/Menu.svelte";
  import DebotInput from "./Elements/Input.svelte";
  import DebotInputAmount from "./Elements/InputAmount.svelte";
  import DebotInputConfirm from "./Elements/InputConfirm.svelte";
  import DebotInputAddress from "./Elements/InputAddress.svelte";
  import DebotInputNumber from "./Elements/InputNumber.svelte";
  import DebotSelectKey from "./Elements/SelectKey.svelte";
  import DebotScanQrCode from "./Elements/ScanQrCode.svelte";
  import DebotNetwork from "./Elements/Network.svelte";
  import DebotMedia from "./Elements/Media.svelte";
  import DebotBase64 from "./Elements/Base64.svelte";

  import DebotInfoElement from "./../lib/element/DebotInfoElement";
  import FatalElement from "./../lib/element/FatalElement";
  import TextElement from "./../lib/element/TextElement";
  import MenuElement from "./../lib/element/MenuElement";
  import InputElement from "./../lib/element/InputElement";
  import InputAmountElement from "./../lib/element/InputAmountElement";
  import InputConfirmElement from "./../lib/element/InputConfirmElement";
  import InputAddressElement from "./../lib/element/InputAddressElement";
  import InputNumberElement from "./../lib/element/InputNumberElement";
  import SelectKeyElement from "./../lib/element/SelectKeyElement";
  import ScanQrCodeElement from "./../lib/element/ScanQrCodeElement";
  import NetworkElement from "./../lib/element/NetworkElement";
  import MediaElement from "./../lib/element/MediaElement";
  import Base64Element from "./../lib/element/Base64Element";

  export let element;
  //  <svelte:component this={Elements[$currentPage.name]} />
</script>

<div>
  {#if element instanceof DebotInfoElement}
    <DebotInfo element={element} />
  {/if}
  {#if element instanceof FatalElement}
    <DebotFatal element={element} />
  {/if}
  {#if element instanceof TextElement}
    <DebotText element={element}/>
  {/if}
  {#if element instanceof MenuElement}
    <DebotMenu element={element}/>
  {/if}
  {#if element instanceof InputElement}
    <DebotInput element={element}/>
  {/if}
  {#if element instanceof InputAmountElement}
    <DebotInputAmount element={element}/>
  {/if}
  {#if element instanceof InputConfirmElement}
    <DebotInputConfirm element={element}/>
  {/if}
  {#if element instanceof InputAddressElement}
    <DebotInputAddress element={element}/>
  {/if}
  {#if element instanceof InputNumberElement}
    <DebotInputNumber element={element}/>
  {/if}
  {#if element instanceof SelectKeyElement}
    <DebotSelectKey element={element}/>
  {/if}
  {#if element instanceof ScanQrCodeElement}
    <DebotScanQrCode element={element}/>
  {/if}
  {#if element instanceof NetworkElement}
    <DebotNetwork element={element}/>
  {/if}
  {#if element instanceof MediaElement}
    <DebotMedia element={element}/>
  {/if}
  {#if element instanceof Base64Element}
    <DebotBase64 element={element}/>
  {/if}
</div>