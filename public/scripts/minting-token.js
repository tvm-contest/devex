
var obj = JSON.parse(address)
console.log(obj.collection.parameters)
console.log(obj)
if(obj.collection.rarities != []){
    $(".rarities ").append($(`<label> Rarities<label>`))
    $(".rarities").append($(`<div class="col"id="rarities">`))
    var listRar = []
    for(var keyID in obj.collection.rarities){
        listRar.push(obj.collection.rarities[keyID].name)
    }
    $("#rarities ").append($(`<label>( ${listRar})<label>`))
    $(`#rarities`).append($(`<input class="form-control" name="rarities">`)) 
}

if(obj.mediafiles != []){
    var nameMedia = []
    for(var name in obj.mediafiles){
        nameMedia.push(obj.mediafiles[name].name)//!
    }
}

console.log(nameMedia)
if(obj.collection.parameters != []){
    $(".parameters ").append($(`<label> Parameters<label>`))
    for(var keyID in obj.collection.parameters){
        if ($.inArray(obj.collection.parameters[keyID].name, nameMedia) != -1 && obj.collection.parameters[keyID].type == "string"){//! 
            $(".mediafile ").append($(`<label> MediaFile<label>`))
            $(".mediafile ").append($(`<div class="col"id="mediafile${keyID}">`))
            $(`#mediafile${keyID}`).append($(`<label class="form-label"> ${obj.collection.parameters[keyID].name}<label>`))
            $(`#mediafile${keyID}`).append($(`<input class="form-control" name="paramener[mediafile][${obj.collection.parameters[keyID].name}][${keyID}]">`))  
        } else if (obj.collection.parameters[keyID].name.substring(0,4) == "enum")//!
            { 
                $(".parameters").append($(`<br><label>  Enum <label>`))
                for(var keyIdColEnum in obj.enums){
                    for(var keyIDenum in obj.enums[keyIdColEnum].enumVariants){
                        console.log(obj.enums[keyIdColEnum].enumVariants[keyIDenum])
                        $(".parameters").append($(`<div class="col" id="paramenersE${keyIDenum}">`))
                        $(`#paramenersE${keyIDenum}`).append($(`<label class="form-label"> ${obj.enums[keyIdColEnum].enumVariants[keyIDenum]}<label>`))
                        $(`#paramenersE${keyIDenum}`).append($(`<input class="form-control" name="paramener[enum][${obj.enums[keyIdColEnum].enumVariants[keyIDenum]}][${keyIDenum}]">`)) 
                    }
                }
                } else {
                $(".parameters").append($(`<div class="col"id="parameters${keyID}">`))
                $(`#parameters${keyID}`).append($(`<label class="form-label"> ${obj.collection.parameters[keyID].name}<label>`))
                $(`#parameters${keyID}`).append($(`<input class="form-control" name="paramener[${obj.collection.parameters[keyID].name}][${keyID}]">`))   
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