export default class NetworkElement {
  constructor(answerId, method, url, headers, body = null) {
    this.isUsed = false;
    this.answerId = answerId;
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.body = body;
  }

  setUsed() {
    this.isUsed = true;
  }
}
