function decodeString(encodedString: string) {

	const decodedString = Buffer.from(encodedString, 'hex').toString();

	return decodedString;
}

export default decodeString;
