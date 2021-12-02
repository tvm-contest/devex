var arr_collection_type = []
var arr_collection_param = []
value_id = 1
param_id = 0
$('form').on("change", ".type-parameter",function(){
    var curentSelectedVal = $(this).find('option:selected').val();
    if (curentSelectedVal === "number") {
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-number").css('display','flex');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-string").css('display','none');
    } else if(curentSelectedVal === "line"){
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-string").css('display','flex');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-number").css('display','none');
    }
});

const addParam = () => {
    let typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = $(".block-for-col-param-choice")[0].innerHTML
    typeConteiner.className = "block-for-col-param-choice"
    param_id=param_id+1
    typeConteiner.id="p"+param_id
    arr_collection_param.push(param_id)
    $(".content-param")[0].append(typeConteiner)
    $(`.block-for-col-param-choice#p${param_id}`).find(".row.parameter-number").css('display','none');
    $(`.block-for-col-param-choice#p${param_id}`).find(".row.parameter-string").css('display','none');
    $(`.block-for-col-param-choice#${param_id}`).find(".row.parameter-string").css('display','none');
    $(`.block-for-col-param-choice#${param_id}`).find(".row.parameter-number").css('display','none');

    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-number").find(".param-num-min").attr('name', `parameter[${param_id}][number][min]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-number").find(".param-num-max").attr('name', `parameter[${param_id}][number][max]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-string").find(".param-line-min").attr('name', `parameter[${param_id}][line][min]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-string").find(".param-line-max").attr('name', `parameter[${param_id}][line][max]`);
    
}
const deleteParam = () => {
    if (arr_collection_param.length > 0){
        $(`#p${arr_collection_param[arr_collection_param.length - 1]}`).remove()
        arr_collection_param.pop()
        param_id= param_id - 1
    }
}
const addType = () => {
    let typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = $(".row.collection-type-")[0].innerHTML
    typeConteiner.className = "row collection-type-"
    arr_collection_type.push(value_id)
    typeConteiner.id="c"+ value_id
    $(".block-for-col-types")[0].append(typeConteiner)
    $(`#c${value_id}.row.collection-type-`).find(".col-limit").attr('name', `type[${value_id}][limit]` );
    $(`#c${value_id}.row.collection-type-`).find(".col-name").attr('name', `type[${value_id}][name]` );
    value_id= value_id+1
}
const deleteType = () => {
    if ($(".row.collection-type-").length >1 || arr_collection_type.length > 0){
        $(`#c${arr_collection_type[arr_collection_type.length - 1]}`).remove()
        arr_collection_type.pop()
        value_id= value_id - 1
    }
}
