import classNames from "classnames"
import { FC } from "react"
import { MessageTypeEnum, SenderEnum } from "../../common/enums/enums"
import { MessageType } from "../../common/types/commonTypes"

type propsType = {
    message: MessageType
}

const Message: FC<propsType> = (props) => {
    const { messageTitile, messageDesc, sender, type } = props.message
    return (
        <div className={classNames(
            sender === SenderEnum.me ?
                'message-container-from-me' : 'message-container-from-debot',
            'message'
        )}>

            <div className={
                classNames(
                    sender === SenderEnum.me ?
                        'message__from-me' : 'message__from-debot',
                    { 'message__confirm_yes': type === MessageTypeEnum.confirmYes },
                    { 'message__confirm_no': type === MessageTypeEnum.confirmNo },
                    'message__title',
                    { '_center': messageTitile.length < 5 },
                )
            }>
                {(type !== MessageTypeEnum.qr && type !== MessageTypeEnum.img) && <span>{messageTitile}</span>}
                {(type === MessageTypeEnum.qr && messageDesc) && <a href={messageDesc} target="_blank"><img className={'message__qr'} src={messageTitile} alt="qr" /></a>}
                {(type === MessageTypeEnum.qr && !messageDesc) && <img className={'message__qr'} src={messageTitile} alt="qr" />}
                {(type === MessageTypeEnum.img) && <img className={'message__qr'} src={messageTitile} alt="qr" />}
            </div>
        </div>
    )
}

export default Message