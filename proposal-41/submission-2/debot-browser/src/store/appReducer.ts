import { NetworksUrlType } from './../common/utils/tonClient';
import { DateTimeParams, InitialData, InitializationPayloadType, MenuItemType, MinMaxType, UrlParamsType } from './../common/types/commonTypes';
import { CurrentInput, SenderEnum } from './../common/enums/enums';
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageType } from "../common/types/commonTypes";
import { DebotInfo } from '@tonclient/core';
import dEngine from '../DEngine';
import clientController, { NetworksType } from '../common/utils/tonClient';
import { getNetworkUrl } from '../common/utils/checkIsValidNetwork';

export const runDebot = createAsyncThunk(
    'app/runDebot',
    async ({ debotAddr, debotNetwork }: InitialData, thunkAPI) => {
        try {
            const currentNetwork = clientController.selectedNetwork
            clientController.setSelectedNetwork(debotNetwork.url as NetworksUrlType)
            const result = await dEngine.runDebot(debotAddr);
            if (result) {
                thunkAPI.dispatch(initializeApp({
                    initialData: { debotAddr, debotNetwork },
                    info: result.info
                }))
                thunkAPI.dispatch(setCurrentNetwork(debotNetwork.url))
            } else {
                clientController.setSelectedNetwork(currentNetwork)
            }
        } catch (error) {
            console.error(error)
        }
    }
)

interface appState {
    currentDebotAddr: string
    currentDebotHandle: number
    currentNetwork: NetworksUrlType
    availableNetworks: NetType[]
    initialData: InitialData
    messages: MessageType[]
    menu: MenuItemType[]
    currentInput: CurrentInput
    currentInterfaceId: string
    currentAnswerId: string
    minMax: MinMaxType
    debotInfo: DebotInfo | null
    dateTimeParams: DateTimeParams
}

let initialState: appState = {
    currentDebotAddr: '',
    currentDebotHandle: 0,
    currentNetwork: 'https://main.ton.dev',
    availableNetworks: [
        { name: "DEVNET", url: "https://net.ton.dev" },
        { name: "MAINNET", url: "https://main.ton.dev" }
    ],
    initialData: {
        debotAddr: '',
        debotNetwork: {
            name: 'MAINNET',
            url: 'https://main.ton.dev'
        }
    },
    messages: [],
    menu: [],
    currentInput: CurrentInput.null,
    currentInterfaceId: '',
    currentAnswerId: '',
    minMax: {
        min: 0,
        max: 0
    },
    debotInfo: null,
    dateTimeParams: {
        minTime: 0,
        maxTime: 0,
        minuteInterval: 0,
        defaultTime: 0,
        inputType: ''
    }
};

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setDebotAddr: (state, action: PayloadAction<string>) => {
            state.currentDebotAddr = action.payload
        },
        setDebotHandle: (state, action: PayloadAction<number>) => {
            state.currentDebotHandle = action.payload
        },
        addMessage: (state, action: PayloadAction<MessageType>) => {
            state.messages.push(action.payload)
        },
        setInput: (state, action: PayloadAction<CurrentInput>) => {
            state.currentInput = action.payload
        },
        setInterfaceId: (state, action: PayloadAction<string>) => {
            state.currentInterfaceId = action.payload
        },
        setMenu: (state, action: PayloadAction<MenuItemType[]>) => {
            state.menu = action.payload
        },
        setAnswerId: (state, action: PayloadAction<string>) => {
            state.currentAnswerId = action.payload
        },
        setMinMax: (state, action: PayloadAction<MinMaxType>) => {
            state.minMax = action.payload
        },
        setDebotInfo: (state, action: PayloadAction<DebotInfo>) => {
            state.debotInfo = action.payload
        },
        setInitialData: (state, action: PayloadAction<InitialData>) => {
            state.initialData = action.payload
        },
        setCurrentNetwork: (state, action: PayloadAction<NetworksUrlType>) => {
            clientController.setSelectedNetwork(action.payload)
            state.currentNetwork = action.payload
        },
        setAvailableNetworks: (state, action: PayloadAction<NetType[]>) => {
            state.availableNetworks = []
            action.payload.forEach((el) => {
                if (!clientController.networkMap.has(el.url)) {
                    clientController.addNetwork(el.url)
                }
                state.availableNetworks.push(el)
            })
        },
        setDateTimeParams: (state, action: PayloadAction<DateTimeParams | undefined>) => {
            if (action.payload) {
                state.dateTimeParams = action.payload
            } else {
                state.dateTimeParams = {
                    minTime: 0,
                    maxTime: 0,
                    minuteInterval: 0,
                    defaultTime: 0,
                    inputType: ''
                }
            }
        },
        initializeApp: (state, action: PayloadAction<InitializationPayloadType>) => {
            state.currentDebotAddr = action.payload.initialData.debotAddr
            state.initialData = {
                debotAddr: action.payload.initialData.debotAddr,
                debotNetwork: action.payload.initialData.debotNetwork
            }
            state.messages = [{ messageTitile: action.payload.info.hello, sender: SenderEnum.debot }]
            state.menu = []
            state.currentInput = CurrentInput.null
            state.currentInterfaceId = ''
            state.currentAnswerId = ''
            state.minMax = {
                min: 0,
                max: 0
            }
            state.debotInfo = action.payload.info
        },
    },
});

export const { setDebotAddr, addMessage, setInput, setInterfaceId, setMenu, setAnswerId, setMinMax, setDebotInfo, setInitialData, initializeApp, setDebotHandle, setDateTimeParams, setCurrentNetwork, setAvailableNetworks } = appSlice.actions

export default appSlice.reducer

export type NetType = { name: NetworksType, url: NetworksUrlType }

