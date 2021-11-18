import { Button } from "antd"
import { FC } from "react"
import { SenderEnum } from "../../common/enums/enums"
import { useAppDispatch, useAppSelector } from "../../common/hooks/hooks"
import { MenuItemType, MessageType } from "../../common/types/commonTypes"
import { runDebotFunction } from "../../common/utils/callDebotFunction"
import { addMessage, setInterfaceId, setMenu } from "../../store/appReducer"
import { v4 as uuidv4 } from 'uuid';

type MenuInputPropsType = {
    menuItems: MenuItemType[]
}

const MenuInput: FC<MenuInputPropsType> = ({ menuItems }) => {
    return (
        <div className={'menu'}>
            {menuItems.map((el) => <MenuItem key={uuidv4()} {...el} />)}
        </div>
    )
}



const MenuItem: FC<MenuItemType> = ({ title, desc, answerId, index }) => {
    const dispatch = useAppDispatch()
    const interfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const onClickHandler = () => {
        const message: MessageType = {
            messageTitile: title,
            sender: SenderEnum.me
        }
        dispatch(addMessage(message))
        runDebotFunction(answerId, interfaceId, { index })
        dispatch(setMenu([]))
        dispatch(setInterfaceId(''))
    }
    return (
        <>
            <Button onClick={onClickHandler} type='primary' className={'menu__el'}>
                <span>{title}</span>
                <span>{desc}</span>
            </Button>
        </>
    )
}

export default MenuInput