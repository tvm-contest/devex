import { JSON_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import { store } from '../../store/store';
import { setAnswerId, setInterfaceId } from '../../store/appReducer';
import { runDebotFunction } from '../../common/utils/callDebotFunction';

const ID = '442288826041d564ccedc579674f17c1b0a3452df799656a9167a41ab270ec19';

class Json {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = JSON_ABI;
	}

	deserialize(params: any) {
		const { answerId, json } = params.value;

		const obj = JSON.parse(json)

		store.dispatch(setAnswerId(answerId))
		store.dispatch(setInterfaceId(this.id))

		if (obj) {
			runDebotFunction(answerId, this.id, { result: true, obj })
		} else {
			runDebotFunction(answerId, this.id, { result: false, obj: {} })
		}
	}

	parse(params: any) {
		const { answerId/* , json */ } = params.value;
		console.error("not yet supported")
		runDebotFunction(answerId, this.id, { result: false, obj: {} })
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
				case 'deserialize':
					return this.deserialize(extendedParams);
				case 'parse':
					return this.parse(extendedParams);
				default:
					throw new Error(`Function does not exist on interface: ${this.constructor.name}`);
			}
		} catch (err) {
			console.error('Interface execution failed: ', err);
		}
	}
}

export default Json;
