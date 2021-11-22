const addType = () => {
    let typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = $(".collection-type")[0].innerHTML
    typeConteiner.className = "collection-type"
    $(".collection-type-list")[0].append(typeConteiner)
}

const deleteType = (elem) => {
    if ($(".collection-type").length >1)
        elem.parentElement.remove()
}

const checkLatinInput = (elem) => {
    elem.value = elem.value.replace(/[^A-Za-z0-9_]/g, '');
}

const checkNumberInput = (elem) => {
    elem.value = elem.value.replace(/[^0-9]/g, '');
}