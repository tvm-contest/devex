function b64toUtfString(str: string): string {
	return decodeURIComponent(escape(window.atob(str)));
}

export default b64toUtfString;
