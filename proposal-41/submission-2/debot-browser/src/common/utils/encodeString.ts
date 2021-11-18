function encodeString(decodedString: string) {

	const hex = unescape(encodeURIComponent(decodedString))
		.split('')
		.map(char => char.charCodeAt(0).toString(16))
		.join('');

	return hex;
}

export default encodeString;
