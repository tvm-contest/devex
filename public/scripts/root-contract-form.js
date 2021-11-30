let arr_collection_type = []
value_id = 0
const addType = () => {
    let typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = $(".block-for-col_type")[0].innerHTML
    arr_collection_type.push(value_id)
    typeConteiner.id=value_id
    $(".content")[0].append(typeConteiner)
    value_id= value_id+1
}

const deleteType = () => {
    if ($(".row.collection-type-").length >1 || arr_collection_type.length > 0){
        $(`#${arr_collection_type[arr_collection_type.length - 1]}`).remove()
        arr_collection_type.pop()
        value_id= value_id - 1
    }
}


const checkLatinInput = (elem) => {
    elem.value = elem.value.replace(/[^A-Za-z0-9_]/g, '');
}

const checkNumberInput = (elem) => {
    elem.value = elem.value.replace(/[^0-9]/g, '');
}