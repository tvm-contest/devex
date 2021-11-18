export default class MediaElement {
  constructor(data, prompt, answerId) {
    this.isUsed = false;
    this.data = data;
    this.prompt = prompt;
    this.answerId = answerId;
  }

  setUsed() {
    this.isUsed = true;
  }
}
