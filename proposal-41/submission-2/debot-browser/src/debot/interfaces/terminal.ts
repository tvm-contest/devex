import { CurrentInput, SenderEnum } from './../../common/enums/enums';
import tonClientController from "../../common/utils/tonClient"
import { TERMINAL_ABI } from '../ABIs';
import decodeString from '../../common/utils/decodeString';
import { runDebotFunction } from "../../common/utils/callDebotFunction";
import { store } from "../../store/store";
import { addMessage, setAnswerId, setInput, setInterfaceId } from "../../store/appReducer";
import { MessageType } from "../../common/types/commonTypes";

const ID = '8796536366ee21852db56dccb60bc564598b618c865fc50c8b1ab740bba128e3';

class Terminal {
	abi: any
	id: string
	constructor() {
		this.id = ID;
		this.abi = TERMINAL_ABI;
	}

	inputStr(params: any) {
		const { answerId, multiline, prompt } = params.value;
		console.log(multiline)

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

	print(params: any) {
		const { answerId, message } = params.value;

		const decodedMessage = decodeString(message);
		const sendedMessage: MessageType = {
			messageTitile: decodedMessage,
			sender: SenderEnum.debot
		};

		store.dispatch(addMessage(sendedMessage))

		runDebotFunction(answerId, this.id, "")
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
				case 'input':
					return this.inputStr(extendedParams);

				case 'inputStr':
					return this.inputStr(extendedParams);

				// case 'inputInt':
				// 	return this.inputInt(extendedParams);

				// case 'inputUint':
				// 	return this.inputInt(extendedParams);

				// case 'inputTons':
				// 	return this.inputTons(extendedParams);

				// case 'inputBoolean':
				// 	return this.inputBoolean(extendedParams);

				case 'print':
					return this.print(extendedParams);

				default:
					throw new Error(`Function does not exist on interface: ${this.constructor.name}`);
			}
		} catch (err) {
			console.error('Interface execution failed: ', err);
		}
	}
}

export default Terminal;