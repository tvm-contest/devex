import { CONFIRM_INPUT_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import decodeString from '../../common/utils/decodeString';
import { MessageType } from '../../common/types/commonTypes';
import { CurrentInput, SenderEnum } from '../../common/enums/enums';
import { store } from '../../store/store';
import { addMessage, setAnswerId, setInput, setInterfaceId } from '../../store/appReducer';

const ID = '16653eaf34c921467120f2685d425ff963db5cbb5aa676a62a2e33bfc3f6828a';

class ConfirmInput {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = CONFIRM_INPUT_ABI;
	}

	get(params: any) {
		const { answerId, prompt } = params.value;

		const decodedPrompt = decodeString(prompt);

		const debotMessage: MessageType = {
			messageTitile: decodedPrompt,
			sender: SenderEnum.debot
		};

		store.dispatch(setAnswerId(answerId))
		store.dispatch(addMessage(debotMessage))
		store.dispatch(setInterfaceId(this.id))
		store.dispatch(setInput(CurrentInput.stringInput))
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

				default:
					throw new Error(`Function does not exist on interface: ${this.constructor.name}`);
			}
		} catch (err) {
			console.error('Interface execution failed: ', err);
		}
	}
}

export default ConfirmInput;
