# TON Solidity support for Visual Studio code

**Files must have `.tsol` extension**

<div align="center">
  <img src="./images/icon.png" title="TON Solidity vscode extension">
</div>

[![Version](https://vsmarketplacebadge.apphb.com/version/mytonwallet.ton-solidity-extension.svg)](https://marketplace.visualstudio.com/items?itemName=mytonwallet.ton-solidity-extension)  [![Downloads](https://vsmarketplacebadge.apphb.com/downloads/mytonwallet.ton-solidity-extension.svg)](https://marketplace.visualstudio.com/items?itemName=mytonwallet.ton-solidity-extension) [![Installs](https://vsmarketplacebadge.apphb.com/installs/mytonwallet.ton-solidity-extension.svg)](https://marketplace.visualstudio.com/items?itemName=mytonwallet.ton-solidity-extension) [![Rating](https://vsmarketplacebadge.apphb.com/rating-star/mytonwallet.solidity.svg)](https://marketplace.visualstudio.com/items?itemName=mytonwallet.ton-solidity-extension#review-details)

![Screenshot auto compilation TON Solidity vscode extension](images/auto_compilation.gif)

TON Solidity is the language used in Free TON project to create smart contracts.
This extension use extended Solidity language and provides: 

* Syntax highlighting
* Own extension `.tsol` that allows working with Solidity code and TON Solidity language extension
* The extension can be associated with `.sol` files. Also exist "toggle file extension" command to migrate between `.sol` to `.tsol` and vice versa
* Snippets 
* Additional information by hover event
* Code completion for all contracts / libraries in the current file and all referenced imports
* Code completion for all variables, functions, global parameters and unique types for TVM
* Linting using Solhint or Solium
* Covered all extension for TON compiler accordance with https://github.com/tonlabs/TON-Solidity-Compiler/blob/master/API.md
* Built-in compiler with auto compilation tvc + abi.json files

# Instructions

## Code completion

Autocomplete is generally supported across for smart contracts, structs, functions, events, variables, using, inheritance. Autocomplete should happen automatically or press Ctrl+Space or Command+Space in areas like "import".

![Screenshot autocomplete TON Solidity vscode extension](images/autocomple.gif)

## Auto compilation and error highlighting

Auto compilation of files and error highlighting can be enabled or disabled using user settings. Also a default delay is implemented for all the validations (compilation and linting) as ton-solidity compilation can be slow when you have many dependencies.

```
"tonsolidity.enabledAsYouTypeCompilationErrorCheck": true,
"tonsolidity.validationDelay": 1500
```

## Additional information by hover event

If hover on a variable with some TVM functions that pop up with the information about property will be shown.

![Screenshot hover event TON Solidity vscode extension](images/hover.gif)

## Linting

There are two linters included with the extension, solhint and solium / ethlint. You can chose your preferred linter using this setting, or disable it by typing ''

### Solhint

To lint ton solidity code you can use the Solhint linter https://github.com/protofire/solhint, the linter can be configured it using the following user settings:

```json
"tonsolidity.linter": "solhint",
"tonsolidity.solhintRules": {
  "avoid-sha3": "warn"
}
```

This extension supports `.solhint.json` configuration file. It must be placed to project root 
directory. After any changes in `.solhint.json` it will be synchronized with current IDE 
configuration. 

This is the default linter now.

NOTE: Solhint plugins are not supported yet.

### Solium / Ethlint

Solium is also supported by the extension https://github.com/duaraghav8/Solium, you can configure it using the following user settings:

```json
"tonsolidity.linter": "solium",
"tonsolidity.soliumRules": {
    "quotes": ["error", "double"],
    "indentation": ["error", 4]
},
```

It can be used to fix some common issue automatically by running command "TON Solidity: Fix document rules using Solium"

![Screenshot toggle file extension TON Solidity vscode extension](images/autofix-solium.gif)

## Toggle file extenstion

Due to fact that need to use `.tsol` file extension, that is not recognized by Github syntax module, etc. you can find the command "TON Solidity: Toggle file extension" usefull for quick solution such issue before publication. This command will change the file extension from `.sol` to `.tsol` and vice versa.
To use this feature need to open the menu on any `folder` in your project explorer. Then choice "TON Solidity: Toggle file extension"

![Screenshot toggle file extension TON Solidity vscode extension](images/toggle-file-extension.gif)

## Legacy compatibility with .sol file extension

For compatibility with legacy code base you can select the parser for `.sol` extension, that can be used instead Solidity language extension. By this fact you can comfortably work with the same file extension.

![Screenshot legacy file extension TON Solidity vscode extension](images/legacy-file-extension.gif)

## Contributing / Issues / Requests

For ideas, issues, additions, modifications please raise an issue or a pull request at https://github.com/mytonwallet/vscode-tonsolidity-extension

# Requested features

- [ ] Formatter
- [x] Show hovers
- [ ] Help with function and method signatures
- [ ] Possible actions on errors or warnings
- [ ] Incrementally format code as the user types
- [ ] Cut out parser, linter and other packages and create new separated