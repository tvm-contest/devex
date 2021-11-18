export default class InputNumberElement {
  constructor(title, answerId, min, max) {
    this.isUsed = false;
    this.title = title;
    this.answerId = answerId;
    this.min = min;
    this.max = max;
    this.value = null;
  }

  setUsed() {
    this.isUsed = true;
  }

  setValue(value) {
    this.value = value;
  }
}
