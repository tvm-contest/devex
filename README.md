# My TON wallet (MTW) DeBot engine and embed tool

<div align="center">
  <img src="./src/debot-browser/assets/img/debot256.png" title="My TON wallet - Debot">
</div>

This repository contains source code for DeBot engine that allow interaction with Free Ton (freeTON) blockchain from web pages.

# Installation additional tools

To easy make the deployment process you need to install `tondev`

```console
npm i -tondev
```

After this step you can install tonos-cli

```console
tondev install tonos-cli
```

# Creating local debot

Install Docker

Run TON OS
```console
npm run run-tonos
```

Deploy DeBot on the local blockchain for Windows
```console
./demoBot/deployLocal.ps1
```

Deploy DeBot on the local blockchain for Linux
```console
./demoBot/deployLocal.ps1
```

To test deployed DeBot

```console
tonos-cli --config ./demoBot/tonos-cli.local-config.json debot fetch 0:dc85009c3cea9bf8849dcd5cb58d36eec5d0fe0aa9c882797483bf3a1b95f0ff
```

# Developing process

To run development process

```console
npm start
```

Navigate in your browser to the http://localhost:10002/debot-browser/index.html to develop "debot browser"

Navigate in your browser to the http://localhost:10002/embed-tool/index.html to develop "embed tool"

# Embed tool

To embed DeBot on any web page you need to select network and enter DeBot address.
You can adjust Debot UI by changing css variables.
Available these variables:

| Name      | Default value |
| --------- | --------- |
| --debot-browser-bg-color | #ffffff |
| --debot-browser-bg-secondary-color | #f3f3f6 |
| --debot-browser-color-primary | #14854F |
| --debot-browser-color-lightGrey | #d2d6dd |
| --debot-browser-color-grey | #747681 |
| --debot-browser-color-darkGrey | #3f4144 |
| --debot-browser-color-error | #d43939 |
| --debot-browser-color-success | #28bd14 |
| --debot-browser-grid-maxWidth | 60rem |
| --debot-browser-grid-gutter | 1rem |
| --debot-browser-font-size | 1rem |
| --debot-browser-font-color | #333333 |
| --debot-browser-font-family-sans | -apple-system, BlinkMacSystemFont, Avenir, "Avenir Next", "Segoe UI", "Roboto", "Oxygen", "Ubuntu" "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif |
| --debot-browser-font-family-mono | monaco, "Consolas", "Lucida Console", monospace |

Also it is possible to redefine css on elements and create own UI.

You can select/adjust:
1. network
2. address
3. language (or specify own from external file, you must to use [this template](/src/debot-browser/assets/locales/en.json) for a translation creating)
4. handler way for used cards
5. UI styles
6. Embedding way (tick iframe if need to embed iframe way)

# Code for embedding

It is possible to use two ways:

1. Code for direct embedding. Web element (Component).
2. Iframe.

For direct embedding way you can use code from "embed tool".
For Iframe need to place code from "embed tool" to any web page. For example on [gist.github.com](https://gist.github.com/) and then insert URL to the Iframe. For example:

```html
<iframe width="300" height="200" src="SOURCE_FROM_https://gist.github.com/"></iframe>
```

