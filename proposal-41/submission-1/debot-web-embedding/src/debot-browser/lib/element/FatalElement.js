export default class FatalElement {
  constructor(exception) {
    this.exception = exception;
    this.isUsed = false;
  }

  setUsed() {
    this.isUsed = true;
  }
}
