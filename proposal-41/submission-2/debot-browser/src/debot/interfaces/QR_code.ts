import { QR_CODE_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import decodeString from '../../common/utils/decodeString';
import { MessageType } from '../../common/types/commonTypes';
import { MessageTypeEnum, SenderEnum } from '../../common/enums/enums';
import { store } from '../../store/store';
import { addMessage, setAnswerId, setInterfaceId } from '../../store/appReducer';
import { runDebotFunction } from '../../common/utils/callDebotFunction';
import { getDeepLink } from '../../common/utils/deeplink';

const qr = require('qrcode')

const ID = '940c152ddf4f920f742507f461026dc08ac56ed3392944d6d3863a409570056b';

class QRCode {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = QR_CODE_ABI;
	}

	draw(params: any) {
		const { answerId, prompt, text } = params.value;

		const decodedPrompt = decodeString(prompt);

		const decodedText = decodeString(text)

		const textObj = JSON.parse(decodedText)

		const setQRLink = (value: string) => {
			try {
				qr.toDataURL(value)
					.then((res: any) => {
						const debotMessage1: MessageType = {
							messageTitile: decodedPrompt,
							sender: SenderEnum.debot,
							type: MessageTypeEnum.string
						};

						const debotMessage2: MessageType = {
							messageTitile: res,
							messageDesc: value,
							sender: SenderEnum.debot,
							type: MessageTypeEnum.qr
						};

						store.dispatch(addMessage(debotMessage1))
						store.dispatch(addMessage(debotMessage2))

						runDebotFunction(answerId, this.id, { result: 0 })
					})
			} catch (error) {
				console.error(error)
			}
		}

		if (textObj && textObj.type === "transaction") {
			const payload = JSON.stringify(textObj.payload)
			getDeepLink(payload, textObj.details)
				.then((res: any) => setQRLink(res))
		} else {
			setQRLink(decodedText)
		}

	}

	// read(params: any) {
	// 	const { answerId, value } = params.value;

	// 	const decodedPrompt = decodeString(prompt);

	// 	const debotMessage: MessageType = {
	// 		messageTitile: decodedPrompt,
	// 		sender: SenderEnum.debot
	// 	};

	// 	store.dispatch(setAnswerId(answerId))
	// 	store.dispatch(addMessage(debotMessage))
	// 	store.dispatch(setInterfaceId(this.id))
	// 	store.dispatch(setInput(CurrentInput.stringInput))
	// }

	// scan(params: any) {
	// 	const { answerId, value } = params.value;

	// 	const decodedPrompt = decodeString(prompt);

	// 	const debotMessage: MessageType = {
	// 		messageTitile: decodedPrompt,
	// 		sender: SenderEnum.debot
	// 	};

	// 	store.dispatch(setAnswerId(answerId))
	// 	store.dispatch(addMessage(debotMessage))
	// 	store.dispatch(setInterfaceId(this.id))
	// 	store.dispatch(setInput(CurrentInput.stringInput))
	// }

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
				case 'draw':
					return this.draw(extendedParams);

				default:
					throw new Error(`Function does not exist on interface: ${this.constructor.name}`);
			}
		} catch (err) {
			console.error('Interface execution failed: ', err);
		}
	}
}

export default QRCode;
