import { RegisteredDebot, TonClient } from '@tonclient/core';
import { DEBOT_WC } from './common/constants/index'
import { AppDebotBrowser, DebotInfo } from '@tonclient/core'
import DEngine from './DEngine'
import tonClientController from './common/utils/tonClient'
import InterfacesController from './debot/interfaces/index'
import { store } from './store/store'
import { addMessage, setDebotAddr, setInterfaceId } from './store/appReducer'
import { MessageTypeEnum, SenderEnum } from './common/enums/enums'
import { InterfacesQueueType, ParamsOfAppDebotBrowserApprove, ParamsOfAppDebotBrowserInput, ParamsOfAppDebotBrowserInvokeDebot, ParamsOfAppDebotBrowserLog, ParamsOfAppDebotBrowserSend, ParamsOfAppDebotBrowserSwitch, ResultOfAppDebotBrowserApprove, ResultOfAppDebotBrowserGetSigningBox, ResultOfAppDebotBrowserInput } from './common/types/browserTypes';

class DebotBrowser implements AppDebotBrowser {
  debot_handle: number | null
  debot_abi: string | null
  info: DebotInfo | null
  deprecatedMessageTimeout: any
  interfacesQueue: InterfacesQueueType[]
  client: TonClient
  constructor(client: any) {
    this.debot_handle = null
    this.debot_abi = null
    this.info = null
    this.deprecatedMessageTimeout = null
    this.interfacesQueue = []
    this.client = client
  }

  setDebotParams(params: RegisteredDebot) {
    const { debot_handle, debot_abi, info } = params

    this.debot_handle = debot_handle
    this.debot_abi = debot_abi
    this.info = info
  }

  releaseInterfacesQueue() {
    this.interfacesQueue.shift()

    if (this.interfacesQueue.length) {
      const interfaceState = this.interfacesQueue[0]
      const { interfaceId, debotAddress, params } = interfaceState

      InterfacesController.delegateToInterface(interfaceId, {
        debotAddress,
        ...params,
      })
    }
  }

  clearInterfacesQueue() {
    this.interfacesQueue = []
  }

  showDeprecatedMessage() {
    if (this.deprecatedMessageTimeout)
      clearTimeout(this.deprecatedMessageTimeout)

    this.deprecatedMessageTimeout = setTimeout(() => {
      this.deprecatedMessageTimeout = null

      store.dispatch(addMessage({
        messageTitile: 'This DeBot is deprecated and therefore no longer supported.',
        sender: SenderEnum.debot,
        type: MessageTypeEnum.string
      }))

      console.error('This DeBot is deprecated and therefore no longer supported.')

    }, 1000)
  }

  log(loggerParams: ParamsOfAppDebotBrowserLog) {

    if (loggerParams.msg) {
      store.dispatch(addMessage({ messageTitile: loggerParams.msg, sender: SenderEnum.me }))
    }
  }

  show_action() {
    this.showDeprecatedMessage()
  }

  input(params: ParamsOfAppDebotBrowserInput) {
    console.log(params)
    return new Promise<ResultOfAppDebotBrowserInput>(resolve => {
      console.log(resolve);
    })
    //this.showDeprecatedMessage()
  }

  async get_signing_box() {

    store.dispatch(addMessage({ messageTitile: 'This debot browser cannot send transactions', sender: SenderEnum.debot }))

    store.dispatch(setInterfaceId(''))
    return new Promise<ResultOfAppDebotBrowserGetSigningBox>((resolve, reject) => {
      reject({
        messsage: 'Not support'
      });
    })
  }

  invoke_debot(params: ParamsOfAppDebotBrowserInvokeDebot) {
    this.showDeprecatedMessage()
    console.log(params)
    return new Promise<void>(resolve => console.log(resolve))
  }

  async switch_completed() { }

  async switch(params: ParamsOfAppDebotBrowserSwitch) {
    console.log(params)
  }

  async send(params: ParamsOfAppDebotBrowserSend) {
    try {
      const parsedMessage = await tonClientController.client.boc.parse_message({
        boc: params.message,
      })

      const { dst, src, dst_workchain_id } = parsedMessage.parsed
      const [, interfaceId] = dst.split(':')

      if (dst_workchain_id === DEBOT_WC) {
        this.interfacesQueue.push({
          interfaceId,
          debotAddress: src,
          params,
        })

        if (this.interfacesQueue.length === 1) {
          InterfacesController.delegateToInterface(interfaceId, {
            debotAddress: src,
            ...params,
          })
        }
      } else {
        console.log('Call other debot', parsedMessage, params)


        store.dispatch(setDebotAddr(parsedMessage.parsed.dst))

        const debotParams = DEngine.storage.get(dst)

        if (debotParams) {
          const { debot_handle } = debotParams

          await DEngine.debotModule.send({
            debot_handle,
            message: params.message,
          })
        } else {

          const initParams = await DEngine.initDebot(dst)
          if (initParams) {
            await DEngine.debotModule.send({
              debot_handle: initParams.debot_handle,
              message: params.message,
            })
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async approve(params: ParamsOfAppDebotBrowserApprove) {
    return new Promise<ResultOfAppDebotBrowserApprove>((resolve) => {

      console.log(params)
      resolve({ approved: true })
    })
  }
}

export default DebotBrowser
