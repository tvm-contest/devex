export default class DebotInfoElement {
  constructor(info) {
    this.isUsed = false;
    this.info = info;
  }

  setUsed() {
    this.isUsed = true;
  }
}
