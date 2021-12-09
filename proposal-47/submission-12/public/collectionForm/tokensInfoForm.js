const checkName = (elem) => {
    elem.value = elem.value.replace(/[^A-Za-z0-9_]/g, '');
}

const checkNumber = (elem) => {
    elem.value = elem.value.replace(/[^0-9]/g, '');
}

const addToken = () => {
    let typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = $(".tokensInfo")[0].innerHTML
    typeConteiner.className = "tokensInfo"
    $(".tokensInfo-list")[0].append(typeConteiner)
}

const deleteToken = (elem) => {
    if ($(".tokensInfo").length>1)
        elem.parentElement.remove()
}
