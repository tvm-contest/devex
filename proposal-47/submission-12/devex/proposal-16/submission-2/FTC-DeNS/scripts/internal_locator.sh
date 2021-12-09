#!/usr/bin/env bash

#     TonOS executables locator

#      =/\                 /\=       ))
#     / \'._   (\_/)   _.'/ \          ))
#    / .''._'--(o.o)--'_.''. \           )
#   /.' _/ |`'=/ " \='`| \_ `.\          )
#  /` .' `\;-,'\___/',-;/` '. '\       ))
# /.-' jgs   `\(-V-)/`       `-.\    ))
# `            "   "            `

echo "[*] Locating TonOS executables..."

solc_sys=$(whereis solc | awk '{print $2}')
link_sys=$(whereis tvm_linker | awk '{print $2}')
tcli_sys=$(whereis tonos-cli | awk '{print $2}')

solc=""
link=""
tcli=""

if [[ "$1" != "tcli" ]]; then
  if [[ "$solc_sys" != "" ]]; then
    echo "[<] Using system solc"
    solc="$solc_sys"
  else
    echo "[>] Using local solc"
    solc="../bin/solc"
  fi

  if [[ "$link_sys" != "" ]]; then
    echo "[<] Using system tvm_linker"
    link="$link_sys"
  else
    echo "[>] Using local tvm_linker"
    link="../bin/tvm_linker"
  fi
fi

if [[ "$tcli_sys" != "" ]]; then
  echo "[<] Using system tonos-cli"
  tcli="$tcli_sys"
else
  echo "[>] Using local tonos-cli"
  tcli="../bin/tonos-cli"
fi

if [[ "$1" != "tcli" ]]; then
  if [[ ! -f "$solc" ]]; then
    echo "[*] solc not found! Please download or build solc and install it to bin"
    echo "[*] You can obtain it here: https://github.com/tonlabs/TON-Solidity-Compiler"
    echo "[*] Without it contracts will not be recompiled from source"
  fi

  if [[ ! -f "$link" ]]; then
    echo "[*] tvm_linker not found! Please download or build tvm_linker and install it to bin"
    echo "[*] You can obtain it here: https://github.com/tonlabs/TVM-linker"
    echo "[*] Without it contracts would not be linked from source"
  fi
fi

if [[ ! -f "$tcli" ]]; then
  echo "[!] tonos-cli not found! Please download or build tonos-cli and install it to bin"
  echo "[!] You can obtain it here: https://github.com/tonlabs/tonos-cli"
  echo "!!! It is not possible to proceed without installation of it"
  exit 1
fi

if [[ "$1" != "tcli" ]]; then
  export solc
  export link
fi
export tcli
