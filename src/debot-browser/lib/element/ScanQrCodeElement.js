export default class TextElement {
  constructor(answerId) {
    this.isUsed = false;
    this.answerId = answerId;
  }

  setUsed() {
    this.isUsed = true;
  }
}
