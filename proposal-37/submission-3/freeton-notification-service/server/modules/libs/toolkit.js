const toolkit = {
	Base64Decode(value) {
		return Buffer.from(value, 'base64').toString('utf-8');
	},
}

module.exports = toolkit;