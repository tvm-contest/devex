export default class MenuElement {
  constructor(title, choices) {
    this.isUsed = false;
    this.title = title;
    this.choices = choices;
    this.selectedItem = null;
  }

  setUsed() {
    this.isUsed = true;
  }

  setSelectedItem(value) {
    this.selectedItem = value;
  }
}
