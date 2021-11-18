export default class AmountInputElement {
  constructor(title, answerId) {
    this.isUsed = false;
    this.title = title;
    this.answerId = answerId;
  }

  setUsed() {
    this.isUsed = true;
  }
}
