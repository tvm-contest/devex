
var obj = JSON.parse(address)
if(obj.collection.rarities != []){
    $(".rarities ").append($(`<label> Rarities<label>`))
    $(".rarities").append($(`<div class="col"id="rarities">`))
    $(`#rarities`).append($(`<select class="form-select select-param-token" id ="select-rarities" name="rarities">`))
    //var listRar = []
    
    for(var keyID in obj.collection.rarities){
        $(`#select-rarities`).append($(`<option value=${obj.collection.rarities[keyID].name}> ${obj.collection.rarities[keyID].name}</option>`))
        //listRar.push(obj.collection.rarities[keyID].name)
    }

    //$("#rarities ").append($(`<label>( ${listRar})<label>`))
    //$(`#rarities`).append($(`<input class="form-control" name="rarities">`)) 
}

if(obj.mediafiles != []){
    var nameMedia = []
    for(var name in obj.mediafiles){
        nameMedia.push(obj.mediafiles[name].name)//!
    }
}


if(obj.collection.parameters != []){
    $(".parameters ").append($(`<label> Parameters<label>`))
    for(var keyID in obj.collection.parameters){
        if ($.inArray(obj.collection.parameters[keyID].name, nameMedia) != -1 && obj.collection.parameters[keyID].type == "string" &&obj.collection.parameters[keyID].minValue == null && obj.collection.parameters[keyID].maxValue == null){//! 
            $(".mediafile ").append($(`<label> MediaFile<label>`))
            $(".mediafile ").append($(`<div class="col"id="mediafile${keyID}">`))
            $(`#mediafile${keyID}`).append($(`<label class="form-label"> ${obj.collection.parameters[keyID].name}<label>`))
            $(`#mediafile${keyID}`).append($(`<br><input type="file" class="form-file-input" id="customFile" name="parameters[mediafile][${obj.collection.parameters[keyID].name}]${keyID}">`))  
        } else if (obj.collection.parameters[keyID].type.substring(0,4) != "Enum"){//!
            $(".parameters").append($(`<div class="col"id="parameters${keyID}">`))
            $(`#parameters${keyID}`).append($(`<label class="form-label"> ${obj.collection.parameters[keyID].name}<label>`))
            $(`#parameters${keyID}`).append($(`<input class="form-control" required name="parameters[${obj.collection.parameters[keyID].name}]${keyID}">`))   
        } 
       
        }
}

if (obj.enums.length > 0){
    $(".parameters").append($(`<br><label>  Enum <label>`))

    //var listEnum = []
    for(var keyIdColEnum in obj.enums){
        $(".parameters").append($(`<div class="col" id="paramenersE${keyIdColEnum}">`))
        $(`#paramenersE${keyIdColEnum}`).append($(`<label class="form-label"> ${obj.enums[keyIdColEnum].name}<label>`))

        $(`#paramenersE${keyIdColEnum}`).append($(`<select class="form-select select-param-enum" id ="select-enum${keyIdColEnum}" name="paramener[enum][${obj.enums[keyIdColEnum].name}]${keyIDenum}">`))
        for(var keyIDenum in obj.enums[keyIdColEnum].enumVariants){
            //listEnum.push(obj.enums[keyIdColEnum].enumVariants[keyIDenum])
            $(`#select-enum${keyIdColEnum}`).append($(`<option value=${keyIDenum}> ${obj.enums[keyIdColEnum].enumVariants[keyIDenum]}</option>`))

        }
        //$(`#paramenersE${keyIdColEnum}`).append($(`<label class="form-label"> (${listEnum})<label>`))
        //$(`#paramenersE${keyIdColEnum}`).append($(`<input class="form-control" name="paramener[enum][${obj.enums[keyIdColEnum].name}]${keyIDenum}">`)) 
        //listEnum = []
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