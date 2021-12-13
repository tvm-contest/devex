var arr_collection_type = []
var arr_collection_param = []
var arr_enum_variant = [0]
value_id = 1
param_id = 0
enum_id = 0
var typeConteinerParams = document.createElement('div');
typeConteinerParams.innerHTML = $(".block-for-col-param-choice")[0].innerHTML
typeConteinerParams.className = "block-for-col-param-choice"


$("#type-rarity").on("click", function(){
    if($(this).prop('checked')){
        $(`.complete-block-collections-types`).css('display','block');
    } else{
        $(`.complete-block-collections-types`).css('display','none');
    }
})
$("#use-author").on("click", function(){
    if($(this).prop('checked')){
        $(`.col-6.use-author`).css('display','block');
    } else{
        $(`.col-6.use-author`).css('display','none');
    }
})
$("#commission-favor-owner").on("click", function(){
    if($(this).prop('checked')){
        $(`.commission-favor-owner`).css('display','block');
    } else{
        $(`.commission-favor-owner`).css('display','none');
    }
})
$("#commission-author-generator").on("click", function(){
    if($(this).prop('checked')){
        $(`.commission-author-generator`).css('display','block');
    } else{
        $(`.commission-author-generator`).css('display','none');
    }
})

$(".submit-button").on("click",(function(event){
    event.preventDefault()
    if ($(this).attr("id") === "save-data"){
        $('#form-contract').attr("action","/root-contract-form/save-data")
    } else if ($(this).attr("id") === "form-contracts"){
        $('#form-contract').attr("action","/root-contract-form/form-contracts")
    } else if ($(this).attr("id") === "deploy-contracts"){
        $('#form-contract').attr("action","/root-contract-form/deploy-contracts")
    }
    $('#form-contract').submit()
    
}))


$('form').on("change", ".type-parameter",function(){
    var curentSelectedVal = $(this).find('option:selected').val();
    if (curentSelectedVal === "number") {
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-number").css('display','flex');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-string").css('display','none');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".parameter-enum").css('display','none');
    } else if(curentSelectedVal === "line"){
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-string").css('display','flex');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-number").css('display','none');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".parameter-enum").css('display','none');
    } else if(curentSelectedVal === "enum"){
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-string").css('display','none');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-number").css('display','none');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".parameter-enum").css('display','block');
    } else if(curentSelectedVal === "mediafile"){
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-string").css('display','none');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".row.parameter-number").css('display','none');
        $(`.block-for-col-param-choice#${$(this).parent().parent().parent().attr('id')}`).find(".parameter-enum").css('display','none');
    }
});

const addParam = () => {
    enum_id = 0
    arr_enum_variant.push(0)

    var typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = typeConteinerParams.innerHTML
    typeConteiner.className = "block-for-col-param-choice"
    param_id=param_id+1
    typeConteiner.id="p"+param_id
    arr_collection_param.push(param_id)
    $(".content-param")[0].append(typeConteiner)

    var line = document.createElement('div');
    line.className = "line"
    $(`.block-for-col-param-choice#p${param_id}`)[0].prepend(line)

    $(`.block-for-col-param-choice#p${param_id}`).find(".row.parameter-number").css('display','none');
    $(`.block-for-col-param-choice#p${param_id}`).find(".row.parameter-string").css('display','none');
    $(`.block-for-col-param-choice#p${param_id}`).find(".parameter-enum").css('display','none');
    $(`.block-for-col-param-choice#p${param_id}`).find(".parameter-media-file").css('display','none');


    
    $(`#p${param_id}.block-for-col-param-choice`).find(".param-enum").attr('name', `parameter[${param_id}][enum][0]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".nameParam").attr('name', `parameter[${param_id}][name]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".media-file").attr('name', `parameter[${param_id}][mediafile]`);


    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-number").find(".param-num-min").attr('name', `parameter[${param_id}][number][min]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-number").find(".param-num-max").attr('name', `parameter[${param_id}][number][max]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-string").find(".param-line-min").attr('name', `parameter[${param_id}][line][min]`);
    $(`#p${param_id}.block-for-col-param-choice`).find(".row.parameter-string").find(".param-line-max").attr('name', `parameter[${param_id}][line][max]`);
    
}
const addVariant = (e) => {
    
    let typeConteiner = document.createElement('div');
    typeConteiner.innerHTML = $(".col-12.parameter-enum-variant")[0].innerHTML
    typeConteiner.className = "col-12 parameter-enum-variant"
    id_perent_block = $(e).parent().parent().parent().parent().attr("id")
    arr_enum_variant[id_perent_block[1]]+=1
    
    console.log("id",id_perent_block[1])
    console.log(arr_enum_variant)
    console.log(arr_enum_variant[id_perent_block[1]])
    typeConteiner.id = id_perent_block[1]+ "e" + arr_enum_variant[id_perent_block[1]]
    $(`.block-for-col-param-choice#${id_perent_block}`).find(".param-enum-field")[0].append(typeConteiner)
    
    $(`#${id_perent_block}.block-for-col-param-choice`).find(`#${id_perent_block[1]}e${arr_enum_variant[id_perent_block[1]]}`).find(`.form-control.param-enum`).attr('name', `parameter[${id_perent_block[1]}][enum][${arr_enum_variant[id_perent_block[1]]}]`);
    arr_enum_variant[id_perent_block[1]] = arr_enum_variant[id_perent_block[1]]

}
const deleteParam = () => {
    if (arr_collection_param.length > 0){
        $(`#p${arr_collection_param[arr_collection_param.length - 1]}`).remove()
        arr_collection_param.pop()
        param_id= param_id - 1
    }
    
}
const deleteVariant = (e) =>{
    id_perent_block = $(e).parent().parent().parent().parent().attr("id")
    $(`#${id_perent_block}.block-for-col-param-choice`).find(`#${id_perent_block[1]}e${arr_enum_variant[id_perent_block[1]]}`).remove()
    arr_enum_variant[id_perent_block[1]]-=1
    console.log(arr_enum_variant)

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
