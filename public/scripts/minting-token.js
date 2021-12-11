
var obj = JSON.parse(address)
console.log(obj.collection.parameters)
console.log(obj)

for(var keyID in obj.collection.rarities){
    if(obj.collection.rarities != []){

        $(".rarities ").append($(`<label> Rarities<label>`))
        $(".rarities").append($(`<div class="col"id="rarities${keyID}">`))
        $(`#rarities${keyID}`).append($(`<label class="form-label"> ${obj.collection.rarities[keyID].name}<label>`))
        $(`#rarities${keyID}`).append($(`<input class="form-control" name="rarities[${keyID}]">`)) 
    }  
}

for(var keyID in obj.collection.parameters){
    if(obj.collection.parameters != []){
        $(".parameters ").append($(`<label> Parameters<label>`))
        if (obj.collection.parameters[keyID].type == "enum"){
            $(".parameters").append($(`<label>  Enum <label>`))
            for(var keyIdColEnum in obj.enums){
                for(var keyIDenum in obj.enums[keyIdColEnum].enumVariants){
                    console.log(obj.enums[keyIdColEnum].enumVariants[keyIDenum])
                    $(".parameters").append($(`<div class="col" id="paramenersE${keyIDenum}">`))
                    $(`#paramenersE${keyIDenum}`).append($(`<label class="form-label"> ${obj.enums[keyIdColEnum].enumVariants[keyIDenum]}<label>`))
                    $(`#paramenersE${keyIDenum}`).append($(`<input class="form-control" name="paramener[enum][${keyIDenum}]">`)) 
                }
        }
        } else {
        $(".parameters").append($(`<div class="col"id="parameters${keyID}">`))
        $(`#parameters${keyID}`).append($(`<label class="form-label"> ${obj.collection.parameters[keyID].name}<label>`))
        $(`#parameters${keyID}`).append($(`<input class="form-control" name="paramener[${obj.collection.parameters[keyID].type}][${keyID}]">`))   
        }
    }
}
//
// for(var keyID in obj.mediafiles){
//     if(obj.mediafiles != []){
//         $(".mediafile ").append($(`<label> MediaFile<label>`))
//         $(".mediafile ").append($(`<div class="col"id="mediafile${keyID}">`))
//         $(`#mediafile${keyID}`).append($(`<label class="form-label"> ${obj.mediafiles[keyID].name}<label>`))
//         $(`#mediafile${keyID}`).append($(`<input class="form-control name="mediafile[${keyID}]">`))   
//         console.log(obj.mediafiles[keyID].name)
//     }
    
// }