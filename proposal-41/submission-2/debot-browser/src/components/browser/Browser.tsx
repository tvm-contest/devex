import classNames from "classnames"
import { FC } from "react"
import { InterfaceIDs } from "../../common/enums/enums"
import { useAppSelector } from "../../common/hooks/hooks"
import { MenuItemType } from "../../common/types/commonTypes"
import ConfirmInput from "../inputs/ConfirmInput"
import MenuInput from "../inputs/MenuInput"
import StringInput from "../inputs/StringInput"
import Message from "../message/Message"
import { useEffect } from "react"
import DateTimeInputContainer from "../inputs/DateTimeInputContainer"
import { v4 as uuidv4 } from 'uuid';

const BrowserWindow: FC = () => {
    const messages = useAppSelector(state => state.app.messages)
    const currentInterfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const menuItems: MenuItemType[] = useAppSelector(state => state.app.menu)

    const inputSwitch = () => {
        switch (currentInterfaceId) {
            case InterfaceIDs.menu: {
                return <MenuInput menuItems={menuItems} />
            }
            case InterfaceIDs.confirmInput: {
                return <ConfirmInput />
            }
            case InterfaceIDs.dateTimeInput: {
                return <DateTimeInputContainer />
            }
            case InterfaceIDs.signingBox: {
                return
            }
            default: {
                return <StringInput />
            }
        }
    }
    useEffect(() => {
        const browserWindow = document.getElementById('browser__messages-window')
        browserWindow?.scrollTo(0, browserWindow.scrollHeight)
    }, [messages, currentInterfaceId])
    return (
        <div className={classNames('browser')}>
            <div className={'browser__messages-window'} id={'browser__messages-window'}>
                {messages.map((el, index) => <Message key={uuidv4()} message={el} />)}
            </div>
            <div className={classNames('browser__inputs-window', currentInterfaceId ? 'browser__inputs-window_enable' : 'browser__inputs-window_enable')}>
                {currentInterfaceId && inputSwitch()}
            </div>
        </div>
    )
}

export default BrowserWindow