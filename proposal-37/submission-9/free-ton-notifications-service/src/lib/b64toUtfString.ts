function b64toUtfString(b64Encoded: string): string {
	return Buffer.from(b64Encoded, 'base64').toString();
}

export default b64toUtfString;
