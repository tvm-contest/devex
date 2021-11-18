import { DebotAction, DebotActivity, DebotInfo, RegisteredDebot, SigningBoxHandle } from "@tonclient/core"
import DebotBrowser from "../../DebotBrowser"

export type ParamsOfAppDebotBrowserSend = {
    message: string
}

export type InterfacesQueueType = {
    interfaceId: string
    debotAddress: string
    params: ParamsOfAppDebotBrowserSend
}

export type ParamsOfAppDebotBrowserSwitch = {
    context_id: number
}

export type ParamsOfAppDebotBrowserInvokeDebot = {
    debot_addr: string,
    action: DebotAction
}

export type ParamsOfAppDebotBrowserApprove = {
    activity: DebotActivity
}

export type ResultOfAppDebotBrowserApprove = {
    approved: boolean
}

export type ResultOfAppDebotBrowserGetSigningBox = {
    signing_box: SigningBoxHandle
}

export type ParamsOfAppDebotBrowserInput = {
    prompt: string
}

export type ResultOfAppDebotBrowserInput = {
    value: string
}

export type DEngineStorageValueType = RegisteredDebot & { browser: DebotBrowser }

export type ParamsOfAppDebotBrowserLog = {
    msg: string
}

export type BrowserErrorType = {
    code: string,
    message: string
}

export type DebotAddress = string
