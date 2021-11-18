import { MessageType, MenuItemType } from './../../common/types/commonTypes';
import { MENU_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import decodeString from '../../common/utils/decodeString';
import { store } from '../../store/store';
import { addMessage, setInput, setInterfaceId, setMenu } from '../../store/appReducer';
import { CurrentInput, SenderEnum } from '../../common/enums/enums';

const ID = 'ac1a4d3ecea232e49783df4a23a81823cdca3205dc58cd20c4db259c25605b48';

class Menu {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = MENU_ABI;
	}

	select(params: any) {
		const { description, title, items } = params.value;

		const decodedTitle = decodeString(title);
		const decodedDescription = decodeString(description);

		const debotMessage: MessageType = {
			messageTitile: decodedTitle,
			messageDesc: decodedDescription,
			sender: SenderEnum.debot
		}

		store.dispatch(addMessage(debotMessage))

		const menuItems: MenuItemType[] = items.map((item: any, index: number) => ({
			answerId: item.handlerId,
			title: decodeString(item.title),
			desc: decodeString(item.description),
			index
		}));

		store.dispatch(setMenu(menuItems))
		store.dispatch(setInterfaceId(this.id))
		store.dispatch(setInput(CurrentInput.menu))

		// const result = input("Choose menu index")
		// const menuIndex = parseInt(result)
		// if (items[menuIndex]) {
		// 	runDebotFunction(items[menuIndex].handlerId, this.id, { index: menuIndex })
		// }
	}

	async call(params: any) {
		try {
			const decodedMessage = await tonClientController.client.abi.decode_message({
				abi: {
					type: 'Contract',
					value: this.abi,
				},
				message: params.message,
			});

			const extendedParams = {
				...params,
				...decodedMessage,
			}

			switch (decodedMessage.name) {
				case 'select':
					return this.select(extendedParams);

				default:
					throw new Error(`Function does not exist on interface: ${this.constructor.name}`);
			}
		} catch (err) {
			console.error('Interface execution failed: ', err);
		}
	}
}

export default Menu;
