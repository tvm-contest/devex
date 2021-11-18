import { TonClient } from "@tonclient/core";
import { libWeb } from "@tonclient/lib-web";
import { DEV_NETWORK, LOCAL_NETWORK, MAIN_NETWORK, TON_NETWORK_LS_FIELD } from "../constants";



export type NetworksUrlType = typeof MAIN_NETWORK | typeof DEV_NETWORK/*  | typeof LOCAL_NETWORK */
export type NetworksType = 'MAINNET' | 'DEVNET'/*  | 'LOCAL' */
// @ts-ignore
// eslint-disable-next-line react-hooks/rules-of-hooks
TonClient.useBinaryLibrary(libWeb);

class TonClientController {
  selectedNetwork: NetworksUrlType
  networkMap: Map<string, TonClient>
  constructor() {
    this.selectedNetwork = localStorage.getItem(TON_NETWORK_LS_FIELD) as NetworksUrlType || MAIN_NETWORK;
    this.networkMap = new Map()
    this.networkMap.set(
      MAIN_NETWORK,
      new TonClient({
        network: {
          server_address: MAIN_NETWORK,
        },
      })
    )
    this.networkMap.set(
      DEV_NETWORK,
      new TonClient({
        network: {
          server_address: DEV_NETWORK,
        },
      })
    )
    // this.networkMap.set(
    //   LOCAL_NETWORK,
    //   new TonClient({
    //     network: {
    //       server_address: LOCAL_NETWORK,
    //     },
    //   })
    // )
  }

  addNetwork(network: NetworksUrlType) {
    if (!this.networkMap.has(network)) {
      console.log('addNetwork ', network)
      this.networkMap.set(
        network,
        new TonClient({
          network: {
            server_address: network,
          },
        })
      )
    }
  }

  setSelectedNetwork(network: NetworksUrlType) {
    console.log('setSelectedNetwork ', network)
    localStorage.setItem(TON_NETWORK_LS_FIELD, network);
    if (this.networkMap.has(network)) {
      this.selectedNetwork = network;
    } else {
      console.error('Client has not found')
    }
  }

  get client() {
    return this.networkMap.get(this.selectedNetwork) as TonClient;
  }
}

const clientController = new TonClientController();

export default clientController;