export default class InputAmountElement {
  constructor(title, answerId, min, max, decimals) {
    this.isUsed = false;
    this.title = title;
    this.answerId = answerId;
    this.min = min;
    this.max = max;
    this.decimals = decimals;
    this.value = null;
  }

  setUsed() {
    this.isUsed = true;
  }

  setValue(value) {
    this.value = value;
  }
}
