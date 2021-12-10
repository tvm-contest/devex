import tonClientController from './tonClient';

async function checkIsValidAddress(address: string) {
	try {
		const result = await tonClientController.client.utils.convert_address({
			address,
			output_format: {
				type: 'Hex',
			}
		})

		return !!result;
	} catch (err) {
		return false;
	}
}

export default checkIsValidAddress;
