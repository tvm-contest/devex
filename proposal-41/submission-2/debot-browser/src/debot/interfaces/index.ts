import Terminal from './terminal';
import Media from './media';
import Menu from './menu';
import AmountInput from './amount_input';
import ConfirmInput from './confirm_input';
import AddressInput from './address_input';
import SigningBox from './signing_box_input';
import QRCode from './QR_code';
import Json from './Json';
import DateTimeInput from './date_time_input';
import NumberInput from './number_input';
import { BASE_64_ID, HEX_ID, JSON_ID, NETWORK_ID, SDK_ID } from '../../common/constants';
class InterfacesController {
	state: Map<string, Terminal | Menu | AddressInput | AmountInput | ConfirmInput | QRCode | Json | DateTimeInput | Media | boolean>
	constructor() {
		const terminal = new Terminal();
		const menu = new Menu();
		const amountInput = new AmountInput();
		const confirmInput = new ConfirmInput();
		const addressInput = new AddressInput();
		const signingBox = new SigningBox();
		const qrCode = new QRCode();
		const json = new Json();
		const dateTimeInput = new DateTimeInput()
		const numberInput = new NumberInput();
		const media = new Media();
		const args: [string, Terminal | Menu | AddressInput | AmountInput | ConfirmInput | QRCode | Json | DateTimeInput | Media | boolean][] = [
			[terminal.id, terminal],
			[menu.id, menu],
			[media.id, media],
			[amountInput.id, amountInput],
			[confirmInput.id, confirmInput],
			[addressInput.id, addressInput],
			[signingBox.id, signingBox],
			[qrCode.id, qrCode],
			[json.id, json],
			[dateTimeInput.id, dateTimeInput],
			[numberInput.id, numberInput],
			[BASE_64_ID, true],
			[JSON_ID, true],
			[HEX_ID, true],
			[SDK_ID, true],
			[NETWORK_ID, true]
		]
		this.state = new Map(args);
	}

	checkAreInterfacesSupported(interfaces: any) {
		for (const interfaceAddress of interfaces) {
			const interfaceId = interfaceAddress.slice(2);

			if (!this.state.has(interfaceId))
				return false;
		}

		return true;
	}

	delegateToInterface(interfaceId: string, params: any) {
		const _interface: any = this.state.get(interfaceId);

		console.log(`Calling ${_interface?.constructor?.name} by id: ${interfaceId}`);

		try {
			_interface.call(params);
		} catch (_) {
			console.error(`Interface with id ${interfaceId} is not implemented`);
		}
	}
}

const interfacesController = new InterfacesController();

export default interfacesController;
