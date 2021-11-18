import { SIGNING_BOX_INPUT_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import { store } from '../../store/store';
import { addMessage } from '../../store/appReducer';
import { SenderEnum } from '../../common/enums/enums';

const ID = 'c13024e101c95e71afb1f5fa6d72f633d51e721de0320d73dfd6121a54e4d40a';

class SigningBoxInput {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = SIGNING_BOX_INPUT_ABI;
	}

	get(params: any) {
		store.dispatch(addMessage({ messageTitile: 'This debot browser cannot send transactions', sender: SenderEnum.debot }));
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

export default SigningBoxInput;
