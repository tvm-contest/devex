import { Button } from 'antd'
import { FC } from 'react'
import { CurrentInput, MessageTypeEnum, SenderEnum } from '../../common/enums/enums'
import { useAppDispatch, useAppSelector } from '../../common/hooks/hooks'
import { MessageType } from '../../common/types/commonTypes'
import { runDebotFunction } from '../../common/utils/callDebotFunction'
import { addMessage, setAnswerId, setInput, setInterfaceId } from '../../store/appReducer'

const ConfirmInput: FC = () => {
    const answerId = useAppSelector(state => state.app.currentAnswerId)
    const interfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const dispatch = useAppDispatch()
    const onSubmite = (confirm: boolean) => {
        const message: MessageType = {
            messageTitile: confirm ? 'Yes' : 'No',
            sender: SenderEnum.me,
            type: confirm ? MessageTypeEnum.confirmYes : MessageTypeEnum.confirmNo
        }
        dispatch(addMessage(message))
        runDebotFunction(answerId, interfaceId, { value: confirm })
        dispatch(setInput(CurrentInput.null))
        dispatch(setInterfaceId(''))
        dispatch(setAnswerId(''))
    }
    return (
        <div className={'confirm'}>
            <Button onClick={() => onSubmite(true)} className={'confirm__yes'}>Yes</Button>
            <Button onClick={() => onSubmite(false)} className={'confirm__no'}>No</Button>
        </div>
    )
}

export default ConfirmInput