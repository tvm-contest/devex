export default class SelectKeyElement {
  constructor(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
    this.isUsed = false;
  }

  setUsed() {
    this.isUsed = true;
  }
}
