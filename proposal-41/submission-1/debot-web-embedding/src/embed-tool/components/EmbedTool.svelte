<script>
  import "./Styles.svelte";
  import { Container, Row, Col, Details, Button, Input } from "svelte-chota";

  //Elements
  import Loading from "./Elements/Loading.svelte";
  export let loaded;

  let network = "https://net.ton.dev";
  let botaddress = "";
  let botlanguage = "en";
  let botUsedCard = "opacity";
  let botExLangungeFile = "";
  let iframe = false;

  let tooltiptext = "";

  let showTooltip = false;
  const copyCode = () => {
    if (botaddress == "") {
      tooltiptext = "Enter DeBot address";
      showTooltip = true;
      setTimeout(() => {
        showTooltip = false;
      }, 2000);
      return;
    }
    
    tooltiptext = "Copied!";
    showTooltip = true;
    setTimeout(() => {
      showTooltip = false;
    }, 2000);
    const code = document.getElementById("code");
    navigator.clipboard.writeText(code.innerText);
  }

  const networks = [
    {value: "https://ton.live", name: "Main"},
    {value: "https://net.ton.dev", name: "Testnet"}
  ];

  const updatePreview = () => {
    if (debotAddressIsNotValid) {
      return;
    }
    window.debotBrowser = {};
    window.debotBrowser.targetElementId = "debot-browser";
    window.debotBrowser.network = network;
    window.debotBrowser.address = botaddress;
    window.debotBrowser.language = botlanguage;
    window.debotBrowser.usedCard = botUsedCard;
    window.debotBrowser.exLangungeFile = botExLangungeFile;

    let iframe_code = document.getElementById("iframe-code");
    
    if (document.getElementById("debot-css") != null) {
      document.getElementById("debot-css").remove();
    }
    const css = document.createElement("link");
          css.id = "debot-css";
          css.rel = "stylesheet";
          css.href = "__CDN_URL__/debot.css";
    iframe_code.parentNode.insertBefore(css, iframe_code);

    if (document.getElementById("debot-js") != null) {
      document.getElementById("debot-js").remove();
    }

    const script = document.createElement("script");
          script.id = "debot-js";
          script.async = 1;
          script.src = "__CDN_URL__/debot.js";
          script.type = "text/javascript";
    iframe_code.parentNode.insertBefore(script, iframe_code);
  }
  
  const updatePreviewCss = () => {
    let debot_browser = document.getElementById("debot-browser");
    let plainStyle = [];
    for (let i in customCss) {
      plainStyle.push(`--debot-browser-${customCss[i].name}: ${customCss[i].value};`);
    }

    if (document.getElementById("debot-style") != null) {
      document.getElementById("debot-style").remove();
    }

    const style = document.createElement("style");
    style.id="debot-style";
    style.innerText = `:root { ${plainStyle.join("\n")} }`;

    debot_browser.parentNode.insertBefore(style, debot_browser);
  }

  let customCss = [];
  const addCustomCss = (name, value) => {
    let newName = true;
    for (let i in customCss) {
      if (customCss[i].name == name) {
        customCss[i] = {name, value};
        newName = false;
        break;
      }
    }
    if (newName) {
      customCss.push({name, value});
    }
    customCss = customCss; // ping reactivity
    updatePreviewCss();
  };

  let debotAddressIsNotValid = true;
  const checkBotAddress = (event) => {
    if (event.target.checkValidity()) {
      debotAddressIsNotValid = false;
      botaddress = event.target.value;
      updatePreview();
    }
  }
</script>

<style>
  #tooltip {
    position: relative;
    display: inline-block;
  }

  #tooltip .tooltiptext {
    visibility: hidden;
    width: max-content;
    background-color: black;
    color: #fff;
    text-align: center;
    border-radius: 1rem;
    padding: 0.5rem;
    position: absolute;
    left: 7rem;
    z-index: 1;
  }

  #tooltip.show .tooltiptext {
    visibility: visible;
  }

  .logo {
    height: 8rem;
  }

  .container {
    padding-top: 2rem;
  }

  .caption {
    font-weight: bold;
    font-size: large;
  }

  #iframe-code {
    min-height: 25rem;
  }
</style>

<div class="container">
  <Container>
    {#if $loaded}
      <Row class="header">
        <Col size="12" sizeMD="2" sizeLG="2">
          <img src="assets/img/debot256.png" alt="logo" class="logo" />
        </Col>
        <Col class="is-right">
          <div class="caption">
            This tool allows embedding any DeBot to any web page. Bring modern blockchain technology to the "old web".
          </div>
        </Col>
      </Row>
      <Row class="content-container">
        <Col size="12" sizeMD="8" sizeLG="8">
          <Row>
            <Col>
              <label for="network">Select bot network</label>
              <select id="network" on:change={(event) => {network = event.target.value; updatePreview();}} >
                {#each networks as item}
                  <option selected={item.value == network} value="{item.value}">{item.name}</option>
                {/each}
              </select>
            </Col>
            <Col>
              <label for="debot-address">Enter debot address</label>
              <Input id="debot-address" pattern="{"^-?[0-9]+:[a-f0-9]{64}$"}" required placeholder="Bot address" on:keyup={(event) => checkBotAddress(event)} />
            </Col>
          </Row>
          <Row>
            <Col>
              Preview
              <div id="iframe-code">
                <div id="debot-browser">
                  Please enter DeBot address...
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <Details>
                <span slot="summary">Code to embed the DeBot on your page</span>
<code id="code">
  {#if iframe}
    &lt;!DOCTYPE html&gt;
    &lt;html lang="en"&gt;
      &lt;head&gt;
        &lt;meta charset="utf-8"&gt;
        &lt;meta content="width=device-width, initial-scale=1.0" name="viewport"&gt;
        &lt;title&gt;Embedded DeBot&lt;/title&gt;
      &lt;/head&gt;
      &lt;body&gt;
  {/if}
  &lt;div id="debot-browser"&gt;
    Debot widget is loading, please wait...
  &lt;/div&gt;
  &lt;script type="text/javascript"&gt;
    window.debotBrowser = &lbrace;&rbrace;;
    window.debotBrowser.targetElementId = "debot-browser";
    window.debotBrowser.network = "{network}";
    window.debotBrowser.address = "{botaddress}";
    window.debotBrowser.language = "{botlanguage}";
    window.debotBrowser.usedCard = "{botUsedCard}";
    window.debotBrowser.exLangungeFile = "{botExLangungeFile}";

    var loading = (function(w,d,t,u,n,c,a,m,) &lbrace;
      var loaded = false;
      w['debotBrowserObject'] = n;
      w[n] = w[n] ||
      function() &lbrace;
        (w[n].q = w[n].q || []).push(arguments);
      &rbrace;, w[n].l = 1 * new Date();
      var tag = 'script';
      if (t == 'css') &lbrace;
        tag = 'link';
      &rbrace;
      a = d.createElement(tag),
      m = d.getElementsByTagName(tag)[0];
      if (typeof m == "undefined") &lbrace;
        m = d.getElementsByTagName("head")[0];
      &rbrace;
      a.async = 1;
      if (t == 'css') &lbrace;
        a.href = u;
        a.rel = "stylesheet";
      &rbrace; else &lbrace;
        a.src = u;
        a.type = "text/javascript";
      &rbrace;
      a.onload = a.onreadystatechange = function () &lbrace;
        if (!loaded && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) &lbrace;
          loaded = true;
          setTimeout(c, 1000);
          a.onload = a.onreadystatechange = null;
        &rbrace;
      &rbrace;;
      m.parentNode.insertBefore(a,m);
    &rbrace;);
    loading(window, document, 'css', '__CDN_URL__/debot.css', 'debot-browser-css', function callback () &lbrace;

    &rbrace;);
    loading(window, document, 'script', '__CDN_URL__/debot.js', 'debot-browser-js', function callback () &lbrace;
      runOwnCode();
    &rbrace;);
  &lt;/script&gt;
  &lt;script type="text/javascript"&gt;
    const runOwnCode = function () &lbrace;
      console.info('debot widget is loaded');
      //here is your code
    &rbrace;;
  &lt;/script&gt;
  &lt;style&gt;
    :root &lbrace;
      {#each customCss as item}
      --debot-browser-{item.name}: {item.value};
      {/each}
    &rbrace;
  &lt;/style&gt;
  {#if iframe}
      &lt;/body&gt;
    &lt;/html&gt;
  {/if}
</code>
              </Details>
              <div id="tooltip" class:show={showTooltip}>
                <Button disabled={debotAddressIsNotValid} on:click={() => {copyCode()}}>Copy</Button>
                <span class="tooltiptext">{tooltiptext}</span>
              </div>
            </Col>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col size="12">
              <label for="language">Select language</label>
              <select id="language" on:change={(event) => { botlanguage = event.target.value; updatePreview(); }} >
                <option value="en">English</option>
                <option value="cn">Chinese</option>
                <option value="kr">Korean</option>
                <option value="ru">Russian</option>
              </select>
            </Col>
            <Col size="12">
              <label for="usedCard">Select the handler way for a used card</label>
              <select id="usedCard" on:change={(event) => { botUsedCard = event.target.value; updatePreview(); } }>
                <option value="opacity">Opacity - disable and blur a card</option>
                <option value="hide">Hide - hide a card and leave only text</option>
              </select>
            </Col>
            <Col size="12">
              <label for="language">Specify external language file</label>
              <Input id="language" on:keyup={(event) => botExLangungeFile = event.target.value} />
            </Col>
            <Col size="6">
              <label for="bg-color">Background color</label>
              <input id="bg-color" type="color" on:change={(event) => addCustomCss('bg-color', event.target.value) } value="#ffffff"/>
            </Col>
            <Col size="6">
              <label for="secondary-color">Secondary color</label>
              <input id="secondary-color" type="color" on:change={(event) => addCustomCss('secondary-color', event.target.value)} value="#f3f3f6"/>
            </Col>
            <Col size="6">
              <label for="color-primary">Color primary</label>
              <input id="color-primary" type="color" on:change={(event) => addCustomCss('color-primary', event.target.value)} value="#14854F"/>
            </Col>
            <Col size="6">
              <label for="color-lightGrey">Color lightGrey</label>
              <input id="color-lightGrey" type="color" on:change={(event) => addCustomCss('color-lightGrey', event.target.value)} value="#d2d6dd"/>
            </Col>
            <Col size="6">
              <label for="color-color-grey">Color grey</label>
              <input id="color-color-grey" type="color" on:change={(event) => addCustomCss('color-grey', event.target.value)} value="#747681"/>
            </Col>
            <Col size="6">
              <label for="color-color-darkGrey">Color darkGrey</label>
              <input id="color-color-darkGrey" type="color" on:change={(event) => addCustomCss('color-darkGrey', event.target.value)} value="#3f4144"/>
            </Col>
            <Col size="6">
              <label for="color-color-error">Color error</label>
              <input id="color-color-error" type="color" on:change={(event) => addCustomCss('color-error', event.target.value)} value="#d43939"/>
            </Col>
            <Col size="6">
              <label for="color-color-success">Color success</label>
              <input id="color-color-success" type="color" on:change={(event) => addCustomCss('color-success', event.target.value)} value="#28bd14"/>
            </Col>
            <Col size="6">
              <label for="color-font-color">Font-color</label>
              <input id="color-font-color" type="color" on:change={(event) => addCustomCss('font-color', event.target.value)} value="#333333"/>
            </Col>
            <Col size="6">
              <label for="debot-iframe-style">Embed in iframe</label>
              <Input type="checkbox" id="debot-iframe-style" on:change={(event) => iframe = event.target.checked } />
            </Col>
            <Col size="12">
              <label for="grid-maxWidth">Grid maxWidth</label>
              <input id="grid-maxWidth" on:change={(event) => addCustomCss('grid-maxWidth', event.target.value) } value="60rem"/>
            </Col>
            <Col size="12">
              <label for="grid-gutter">Grid gutter</label>
              <input id="grid-gutter" on:change={(event) => addCustomCss('grid-gutter', event.target.value) } value="2rem"/>
            </Col>
            <Col size="12">
              <label for="font-size">Font size</label>
              <input id="font-size" on:change={(event) => addCustomCss('font-size', event.target.value) } value="1rem"/>
            </Col>
            <Col size="12">
              <label for="font-family-sans">Font family sans</label>
              <input id="font-family-sans" on:change={(event) => addCustomCss('font-family-sans', event.target.value) } value="sans-serif"/>
            </Col>
            <Col size="12">
              <label for="font-family-mono">Font family mono</label>
              <input id="font-family-mono" on:change={(event) => addCustomCss('font-family-mono', event.target.value) } value="monaco, Consolas, Lucida Console, monospace"/>
            </Col>
          </Row>
        </Col>
      </Row>
    {:else}
      <Loading/>
    {/if}
  </Container>
</div>