# Debot browser

## How to use

## Before running the application, you need to install the dependencies

```sh
npm install
```

## To run the application, use the command

```sh
npm run start
```

## To build the application, use the command

```sh
npm run build
```

## Files tree

```sh
.
├── package.json
├── public
│   ├── favicon-32x32.png
│   ├── index.html
│   ├── manifest.json
│   ├── robots.txt
│   └── tonclient.wasm
├── README.md
├── src
│   ├── App.tsx #Main component
│   ├── assets #App assets
│   │   ├── crystal.png
│   │   ├── fonts
│   │   │   └── Inter-VariableFont_slnt,wght.ttf
│   │   ├── local.png
│   │   └── ruby.png
│   ├── common
│   │   ├── constants
│   │   │   └── index.js
│   │   ├── enums
│   │   │   └── enums.ts
│   │   ├── hooks
│   │   │   └── hooks.ts #Custom hooks
│   │   ├── types #Types
│   │   │   ├── browserTypes.ts
│   │   │   └── commonTypes.ts
│   │   └── utils #App utils
│   │       ├── callDebotFunction.ts
│   │       ├── checkIsValidAddress.ts
│   │       ├── checkIsValidNetwork.ts
│   │       ├── dateTimeHelper.ts
│   │       ├── decodeString.ts
│   │       ├── deeplink.ts
│   │       ├── encodeString.ts
│   │       ├── formDebotFunctionFromId.ts
│   │       ├── logoSwitcher.ts
│   │       ├── parseQueryParams.ts
│   │       ├── tonClient.ts
│   │       └── ton-contract.ts
│   ├── components #App components
│   │   ├── browser #Browser component
│   │   │   └── Browser.tsx
│   │   ├── icons #Icon components
│   │   │   ├── DarkThemeIcon.tsx
│   │   │   ├── LightThemeIcon.tsx
│   │   │   ├── Refresh.tsx
│   │   │   ├── Search.tsx
│   │   │   └── Send.tsx
│   │   ├── initializationModal #modal component
│   │   │   └── InitializationModal.tsx
│   │   ├── inputs #Input components
│   │   │   ├── ConfirmInput.tsx
│   │   │   ├── DateInput.tsx
│   │   │   ├── DateTimeInputContainer.tsx
│   │   │   ├── DateTimeInput.tsx
│   │   │   ├── MenuInput.tsx
│   │   │   ├── StringInput.tsx
│   │   │   └── TimeInput.tsx
│   │   └── message #Message component
│   │       └── Message.tsx
│   ├── config.json #Config file
│   ├── debot
│   │   ├── ABIs #Interfaces ABIs
│   │   │   ├── address_input.abi.js
│   │   │   ├── amount_input.abi.js
│   │   │   ├── confirm_input.abi.js
│   │   │   ├── date_time_input.abi.js
│   │   │   ├── index.js
│   │   │   ├── Json.abi.js
│   │   │   ├── media.abi.js
│   │   │   ├── menu.abi.js
│   │   │   ├── number_input.abi.js
│   │   │   ├── QRCode.abi.js
│   │   │   ├── signing_box_input.abi.js
│   │   │   └── terminal.abi.js
│   │   ├── interfaces #Interfaces classes
│   │   │   ├── address_input.ts
│   │   │   ├── amount_input.ts
│   │   │   ├── confirm_input.ts
│   │   │   ├── date_time_input.ts
│   │   │   ├── index.ts
│   │   │   ├── Json.ts
│   │   │   ├── media.ts
│   │   │   ├── menu.ts
│   │   │   ├── number_input.ts
│   │   │   ├── QR_code.ts
│   │   │   ├── signing_box_input.ts
│   │   │   └── terminal.ts
│   ├── DebotBrowser.ts #Module for DEngine
│   ├── DEngine.ts #DebotEngine
│   ├── elements
│   │   └── browser
│   │       └── index.tsx #Custom html element class
│   ├── index.js #Entry point
│   ├── index.sass #Common styles and css variables
│   ├── routes #App routes
│   │   ├── index.sass
│   │   └── index.tsx
│   ├── store #Redux store
│   │   ├── appReducer.ts
│   │   ├── interfaceParamsReducer.ts
│   │   └── store.ts
├── tsconfig.base.json #tsconfig for web-component
├── tsconfig.json #main tsconfig
├── webpack.config.js #confin for build web-component
```
