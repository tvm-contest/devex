<script>
  import "./Styles.svelte";
  import { setContext, beforeUpdate, afterUpdate } from "svelte";
  import { Icon, Row, Col, Button } from "svelte-chota";
  import i18n from "./i18n.js";
  import { approve } from "./../lib/Callbacks.js";
  import { elements, EngineLoading, Engine } from "./../lib/Engine";

  //Elements
  import Loading from "./Elements/Loading.svelte";
  import Modal from "./Elements/Modal.svelte";
  import ApproveDialog from "./Elements/ApproveDialog.svelte";
  import Tag from "./Tag.svelte";
  import TextElement from "./../lib/element/TextElement";

  export let loaded;

  let divTags;
  let autoscroll;
  
  let showModal = false;
  let currentModal;
  let modalData;

  const Modals = { ApproveDialog };

  beforeUpdate(() => {
    autoscroll = divTags && (divTags.offsetHeight + divTags.scrollTop) > (divTags.scrollHeight - 20);
  });

  afterUpdate(() => {
    if (autoscroll) {
      window.scrollTo(0, divTags.scrollHeight);
    }
  });

  const engine = new Engine();

  setContext("app_functions", {
    openModal: (modal, data) => openModal(modal, data),
    getModalData: () => {
      return modalData;
    },
    closeModal: () => (showModal = false),
    getEngine: () => {
      return engine;
    },
  });

  const openModal = (modal, data) => {
    currentModal = modal;
    modalData = data;
    showModal = true;
  };

  const closeModal = () => {
    showModal = false;
  };

  approve.subscribe((value) => {
    if (value && value.activity) {
      openModal("ApproveDialog", value);
    }
  });

  const refresh = () => {
		engine.refresh();
  };

  // For tests only
  let bot = {
    language: 'en',
    network: 'https://net.ton.dev',
    address: '0:433f7b97e4e613397175a2d9d1094643b5b90d1f095c423997f95fbf905a3ae3',
    usedCard: 'opacity', //'hide' 'opacity',
    exLangungeFile: "" //external language file
  };

  if (window.debotBrowser) {
    bot = window.debotBrowser;
  }

  let initialized = false;
  loaded.subscribe((value) => {
    if (value && !initialized) {
      if (bot.exLangungeFile == "") {
        if (!['cn', 'en', 'kr', 'ru'].includes(bot.language)) {
          bot.language = 'en';
        }
        fetch(`__CDN_URL__/assets/locales/${bot.language}.json`).then((result) => {
          return result.json();
        }).then(async(langJson) => {
          i18n.translator.add({
            values: langJson
          });
          await engine.setDebotSettings(bot.network, bot.address);
          initialized = true;
        });
      } else {
        fetch(bot.exLangungeFile).then((result) => {
          return result.json();
        }).then(async(langJson) => {
          i18n.translator.add({
            values: langJson
          });
          await engine.setDebotSettings(bot.network, bot.address);
          initialized = true;
        });
      }
    }
  })
</script>

<style>
  .container {
    display: flex;
    padding-top: 2rem !important;
    flex-grow: 1;
    flex-direction: column;
  }
  .container-opacity {
    opacity: 0.55;
  }
  .container-hide {
    display: none;
  }
</style>
<div class="container">
  {#if $loaded}
    <div bind:this={divTags}>
      {#each $elements as element, id}
        <div data-key={id} class="card { element.isUsed && !(element instanceof TextElement) ? (bot.usedCard == 'opacity' ? 'container-opacity' : 'container-hide') : '' }">
          {#if id === 0 || $elements[id-1].isUsed}
            <Tag element={element} />
          {/if}
        </div>
      {/each}
      {#if $EngineLoading || $elements.length == 0}
        <div class="card">
          <Loading/>
        </div>
      {/if}
    </div>
    <div>
			<Row style="margin-top: 0.5rem;">
        <Col class="is-center"><span>Made by <a target="_blank" href="https://embeddebot.mytonwallet.com/?utm_source=debot_widget">MTW team</a> with &#10084;&#65039;</span></Col>
        <Col class="is-center">
          <Icon on:click={() => {refresh()}} class="click-pointer is-rounded" src="__CDN_URL__/assets/img/refresh.svg" size="1"/>
        </Col>
    	</Row>
    </div>
    {#if showModal}
      <Modal>
        <svelte:component
          this={Modals[currentModal]}
          {modalData}
          {closeModal} />
      </Modal>
    {/if}
  {:else}
    <Loading/>
  {/if}
</div>