import { AMOUNT_INPUT_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import decodeString from '../../common/utils/decodeString';
import { MessageType } from '../../common/types/commonTypes';
import { CurrentInput, SenderEnum } from '../../common/enums/enums';
import { store } from '../../store/store';
import { addMessage, setAnswerId, setInput, setInterfaceId, setMinMax } from '../../store/appReducer';

const ID = 'a1d347099e29c1624c8890619daf207bde18e92df5220a54bcc6d858309ece84';

class AmountInput {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = AMOUNT_INPUT_ABI;
	}

	get(params: any) {
		const { answerId, prompt, min, max, ...config } = params.value;


		config.min = min;
		config.max = max;

		if (max && min && parseInt(max) < parseInt(min)) {
			config.max = min;
		}

		const decodedPrompt = decodeString(prompt);

		const debotMessage: MessageType = {
			messageTitile: decodedPrompt,
			sender: SenderEnum.debot
		};

		store.dispatch(setAnswerId(answerId))
		store.dispatch(setMinMax({ min, max }))
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

export default AmountInput;
