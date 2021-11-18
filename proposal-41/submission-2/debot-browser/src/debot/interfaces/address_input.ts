import { ADDRESS_INPUT_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import decodeString from '../../common/utils/decodeString';
import { MessageType } from '../../common/types/commonTypes';
import { CurrentInput, SenderEnum } from '../../common/enums/enums';
import { addMessage, setAnswerId, setInput, setInterfaceId } from '../../store/appReducer';
import { store } from '../../store/store';

const ID = 'd7ed1bd8e6230871116f4522e58df0a93c5520c56f4ade23ef3d8919a984653b';


class AddressInput {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = ADDRESS_INPUT_ABI;
	}

	get(params: any) {
		const { answerId, prompt } = params.value;

		const decodedPrompt = prompt ? decodeString(prompt) : '';

		const debotMessage: MessageType = {
			messageTitile: decodedPrompt,
			sender: SenderEnum.debot
		};

		store.dispatch(setAnswerId(answerId))
		store.dispatch(addMessage(debotMessage))
		store.dispatch(setInterfaceId(this.id))
		store.dispatch(setInput(CurrentInput.stringInput))
	}

	select(params: any) {
		return this.get(params);
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
				case 'get':
					return this.get(extendedParams);

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

export default AddressInput;
