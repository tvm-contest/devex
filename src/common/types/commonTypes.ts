import { NetType } from './../../store/appReducer';
import { NetworksType } from './../utils/tonClient';
import { MessageTypeEnum, SenderEnum } from './../enums/enums';

export type MessageType = {
    messageTitile: string
    messageDesc?: string
    sender: SenderEnum
    type?: MessageTypeEnum
}

export type MenuItemType = {
    answerId: string
    title: string
    desc: string
    index: number
}

export type InitialData = {
    debotAddr: string,
    debotNetwork: NetType
}

export type UrlParamsType = {
    page?: string,
    addr?: string,
    network?: string
}

export type InitializationPayloadType = {
    initialData: InitialData
    info: any
}

export type MinMaxType = {
    min: number
    max: number
}

export type DateTimeParams = {
    minTime: number
    maxTime: number
    minuteInterval: number
    defaultTime: number
    inTimeZoneOffset?: number
    inputType: DateTimeSwitcher
}

export type DateTimeSwitcher = 'DATE' | 'TIME' | 'DATE_TIME' | ''

export type TimeType = {
    timestamp: number
    timeString: string
}
export type DateType = {
    timestamp: number
    dateString: string
}

export type ThemeType = 'DARK' | 'LIGHT' | 'CUSTOM'