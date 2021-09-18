<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-refresh-toc -->
**Table of Contents**

- [Prerequisites...](#prerequisites)
- [How to run code in this github repository](#how-to-run-code-in-this-github-repository)
  - [Running](#running)
  - [Addig new elements to parser](#addig-new-elements-to-parser)
  - [Debugging](#debugging)
- [See also:](#see-also)

<!-- markdown-toc end -->
Perhaps you want to help work on this project? Or run from the github repository?

# Prerequisites...

You need to have installed

* VSCode. Download [here](https://code.visualstudio.com/download).
* [nodejs](https://nodejs.org/en/)
* [npm](https://www.npmjs.com/get-npm)

There are a number of nodejs packages are needed, like [typescript](https://www.typescriptlang.org/), but you can get those via `npm`,
which is described in a below [section](#how-to-run-code-in-this-github-repository).

# How to run code in this github repository

Clone the repository:

```console
$ git clone https://github.com/mytonwallet/vscode-tonsolidity-extension
Cloning into 'vscode-tonsolidity-extension'...
...
$ cd vscode-tonsolidity-extension
```

Install dependent npm packages:

```console
$ npm install
```

## Running

If you just want to run the code, on the top there is a "Debug" menu item and under that, the second item is "Start Without Debugging", which is also bound the key sequence `Ctrl`-`F5`.

After that, the VSCode window should turn from blue to orange and another window will pop up. In this window you will have the vscode extension installed and enabled.

If you edit a solidity file, which is a file ending in `.tsol` and looks like this:

```solidity
  pragma ton-solidity >=0.6.0;
  pragma experimental ABIEncoderV2;
  pragma ignoreIntOverflow;
  pragma AbiHeader expire;
  pragma AbiHeader pubkey;
  pragma AbiHeader time;

  interface IAccept {
    function acceptTransfer(bytes payload) external payable;
  }
```

This when rendered inside be colorized, for example the tokens "pragma", "ton-solidity" and "0.6.0" may appear in a different color. If the all appear in the same color then the language extension mechanism is not working and there is probably something wrong in the extension. Look in the other VSCode window with the orange frame for what might be wrong.

## Addig new elements to parser 

Add new markup to `./src/parser/tonsolidity.pegjs` and then run this command

```console
npm run rebuildparser
```

## Debugging

You may want to extend this code of may find a problem and want to debug what is going wrong. For this, you start off from the "Debug" menu using the first item on the list "Start Debugging" which is also bound to the function key `F5`. As before the window will go orange a popup menu bar will appear at the top.

__NOTE__: It may happen that after the window goes orange, another and VSCode window with the blue, the "play button" may go from a the parallel bars to "pause" back to "play". When that happens you may also be stopped in `bootstrap-fork.js` at some nonsensical like like line 9 which has no code on it. If this happens (and it may happen several times for each `.tsol` file loaded) just hit the play button to make sure it goes back to the parallel bars. You have 10 seconds from the time this button goes from "Pause" to "Play" to hit the "Play" button. Otherwise in the other VSCode you will get a popup message that reads:

> Extension host did not start in 10 seconds, it might be stopped on the first line and needs a debugger to continue.


# See also:

* [Extension API](https://code.visualstudio.com/api)
* [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)
* [Inspiration](https://github.com/juanfranblanco/vscode-solidity)
