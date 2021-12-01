const checkLatinInput = (elem) => {
  elem.value = elem.value.replace(/[^A-Za-z0-9_]/g, '');
}

const checkNumberInput = (elem) => {
  elem.value = elem.value.replace(/[^0-9]/g, '');
}

const checkAddressInput = (elem) => {
  elem.value = elem.value.replace(/[^A-Za-z0-9:]/g, '');
}