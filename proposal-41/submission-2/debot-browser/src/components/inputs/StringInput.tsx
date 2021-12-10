import { Button, Input } from "antd"
import classNames from "classnames"
import { FC, useState } from "react"
import { CurrentInput, InterfaceIDs, SenderEnum } from "../../common/enums/enums"
import { useAppDispatch, useAppSelector } from "../../common/hooks/hooks"
import { MessageType } from "../../common/types/commonTypes"
import { runDebotFunction } from "../../common/utils/callDebotFunction"
import checkIsValidAddress from "../../common/utils/checkIsValidAddress"
import encodeString from "../../common/utils/encodeString"
import { addMessage, setInput, setInterfaceId, setAnswerId, setMinMax } from "../../store/appReducer"
import SearchIcon from "../icons/Search"
import SendIcon from "../icons/Send"


const StringInput: FC = () => {
    //const [inputValue, setInputValue] = useState<string>('')
    const [error, setError] = useState<string>('')
    const answerId = useAppSelector(state => state.app.currentAnswerId)
    const interfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const minMax = useAppSelector(state => state.app.minMax)
    const dispatch = useAppDispatch()

    let callback;
    const onSubmite = async (e: any) => {
        const inputValue = e.target.value
        const message: MessageType = {
            messageTitile: inputValue,
            sender: SenderEnum.me,
        }
        switch (interfaceId) {
            case InterfaceIDs.amountInput || InterfaceIDs.numberInput: {
                callback = async () => {
                    const numberValue = parseInt(inputValue)
                    if (!numberValue) {
                        return `Invalid data format, please enter a number between ${minMax.min} and ${minMax.max}`
                    }
                    if (numberValue < minMax.min || numberValue > minMax.max) {
                        return `Please enter a number between ${minMax.min} and ${minMax.max}`
                    }
                    runDebotFunction(answerId, interfaceId, { value: numberValue })
                    dispatch(setMinMax({ min: 0, max: 0 }))
                }
                break
            }
            case InterfaceIDs.addressInput: {
                callback = async () => {
                    const res = await checkIsValidAddress(inputValue)
                    if (res) {
                        runDebotFunction(answerId, interfaceId, { value: inputValue })
                    } else {
                        return "invalid address format, please re-enter"
                    }
                }
                break
            }
            default: {
                callback = async () => {
                    runDebotFunction(answerId, interfaceId, { value: encodeString(inputValue) })
                }
            }
        }
        const error = await callback()
        if (error) {
            setError(error)
        } else {
            dispatch(addMessage(message))
            dispatch(setInput(CurrentInput.null))
            dispatch(setInterfaceId(''))
            dispatch(setAnswerId(''))
        }
    }
    return (
        <div className={'string-input'}>
            <span className={classNames(
                "string-input__error",
                { 'error-active': error }
            )}>{error}</span>
            <div className={classNames(
                "string-input__input",
                { 'string-input__input-error': error }
            )}>
                <Input placeholder={
                    interfaceId === InterfaceIDs.amountInput || interfaceId === InterfaceIDs.numberInput
                        ?
                        `Please enter a number between ${minMax.min} and ${minMax.max}`
                        :
                        ''
                }
                    onPressEnter={onSubmite}
                    onChange={() => setError('')}
                    onFocus={() => setError('')}
                    suffix={<SendIcon onClickHandle={onSubmite} />}
                />
            </div>
        </div>
    )
}

export default StringInput