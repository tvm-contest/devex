export default class InputAddressElement {
  constructor(title, answerId) {
    this.isUsed = false;
    this.title = title;
    this.answerId = answerId;
    this.value = null;
  }

  setUsed() {
    this.isUsed = true;
  }

  setValue(value) {
    this.value = value;
  }
}
