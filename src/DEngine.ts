import { CallSet, DebotModule, RegisteredDebot, TonClient } from "@tonclient/core";
import DebotBrowser from "./DebotBrowser";
import InterfacesController from "./debot/interfaces/index";
import formDebotFunctionFromId from "./common/utils/formDebotFunctionFromId";
import tonClientController, { NetworksType } from "./common/utils/tonClient";
import { store } from "./store/store";
import { initializeApp, setDebotHandle } from "./store/appReducer";
import { DEV_NETWORK, LOCAL_NETWORK, MAIN_NETWORK } from "./common/constants";
import { BrowserErrorType, DebotAddress, DEngineStorageValueType } from "./common/types/browserTypes";
import { getNetworkUrl } from "./common/utils/checkIsValidNetwork";

class DEngine {
    storage: Map<DebotAddress, DEngineStorageValueType>
    debotBrowser: DebotBrowser | undefined
    debotModules: Map<NetworksType | string, DebotModule>
    constructor() {
        this.debotModules = new Map()
        this.debotModules.set(MAIN_NETWORK, new DebotModule(tonClientController.networkMap.get(MAIN_NETWORK) as TonClient))
        this.debotModules.set(DEV_NETWORK, new DebotModule(tonClientController.networkMap.get(DEV_NETWORK) as TonClient))
        //this.debotModules.set(LOCAL_NETWORK, new DebotModule(tonClientController.networkMap.get(LOCAL_NETWORK) as TonClient))
        this.storage = new Map();
    }

    get debotModule() {
        const debotModule = this.debotModules.get(tonClientController.selectedNetwork)
        if (debotModule) {
            return debotModule
        } else {
            const newDebotModule = new DebotModule(tonClientController.networkMap.get(tonClientController.selectedNetwork) as TonClient)
            this.debotModules.set(
                tonClientController.selectedNetwork,
                newDebotModule
            )
            return newDebotModule
        }
    }

    async initDebot(address: DebotAddress) {

        this.debotBrowser = new DebotBrowser(this.debotModule.client);
        let initParams: RegisteredDebot | false = false

        try {
            initParams = await this.debotModule.init({ address }, this.debotBrowser);

            const {
                info: { interfaces },
            } = initParams;

            const isDebotSupported = InterfacesController.checkAreInterfacesSupported(interfaces);

            if (!isDebotSupported) return this.showUnsupportedMessage();

            this.debotBrowser.setDebotParams(initParams);
            this.storage.set(address, { ...initParams, browser: this.debotBrowser });
        } catch (err) {
            const error = err as BrowserErrorType
            alert(`Error code: ${error.code}, message: ${error.message}`)
            console.error(error)
        }

        console.log(initParams)

        return initParams;
    }

    async runDebot(address: DebotAddress) {
        const initParams = this.storage.get(address) || await this.initDebot(address);
        if (initParams) {

            const { debot_handle } = initParams;

            try {
                await this.debotModule.start({ debot_handle });
            } catch (error) {
                console.error(error)
            }
            store.dispatch(setDebotHandle(debot_handle))

            return initParams;
        } else {
            console.error('An error occurred while starting the DeBot, try another DeBot')
        }

    }

    async callDebotFunction(debotAddress: DebotAddress, interfaceAddress: string, functionId: string, input: any) {
        const debotParams = this.storage.get(debotAddress);
        if (!debotParams) {
            const initParams = await this.initDebot(debotAddress)
            if (initParams) {
                this.callDebotFunction(debotAddress, interfaceAddress, functionId, input)
            }
        } else {
            const { debot_handle, debot_abi, browser } = debotParams;

            let call_set: CallSet | undefined

            if (functionId && functionId !== "0") {
                const functionName = formDebotFunctionFromId(functionId);

                call_set = {
                    function_name: functionName,
                };

                if (input) {
                    call_set.input = input;
                }
            }

            const encodedMessage = await tonClientController.client.abi.encode_internal_message({
                abi: {
                    type: "Json",
                    value: debot_abi,
                },
                address: debotAddress,
                src_address: interfaceAddress,
                call_set,
                value: "1000000000000000",
            });

            try {
                const sendRes = await this.debotModule.send({ debot_handle, message: encodedMessage.message });
                browser.releaseInterfacesQueue();

                return sendRes;
            } catch (err) {
                console.error(err);
                browser.releaseInterfacesQueue();
            }
        }
    }

    async reloadDebot(address: string) {

        const debotParams = this.storage.get(address);
        if (debotParams) {
            const { browser } = debotParams;

            //@ts-ignore
            store.dispatch(initializeApp({ initialData: { debotAddr: address, debotNetwork: this.debotModule.client.config.network.server_address }, info: debotParams.info }))

            browser.clearInterfacesQueue();
        }

        return this.runDebot(address);
    }

    showUnsupportedMessage() {
        console.error("This DeBot is not yet supported by our browser :(\nTry another browser for now and come back to us later")
    }
}

const dEngine = new DEngine();

export default dEngine;