export default class TextElement {
  constructor(text, answerId) {
    this.isUsed = false;
    this.text = text;
    this.answerId = answerId;
  }

  setUsed() {
    this.isUsed = true;
  }
}
