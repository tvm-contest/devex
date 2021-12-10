export default class InputElement {
  constructor(title, answerId, multiline) {
    this.isUsed = false;
    this.title = title;
    this.answerId = answerId;
    this.multiline = multiline;
    this.value = null;
  }

  setUsed() {
    this.isUsed = true;
  }

  setValue(value) {
    this.value = value;
  }
}
