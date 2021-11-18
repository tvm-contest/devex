export default class Base64Element {
  constructor(answerId, data = null, type = null) {
    this.isUsed = false;
    this.answerId = answerId;
    this.data = data;
    this.type = type;
  }

  setUsed() {
    this.isUsed = true;
  }
}
