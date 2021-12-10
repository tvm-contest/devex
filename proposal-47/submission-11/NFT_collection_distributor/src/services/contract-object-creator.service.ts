import { Request } from "express";
import { Collection } from "../models/collection";
import { DescriptCollection } from "../models/descript-collection";
import { Parametr } from "../models/parametr";
import { Rarity } from "../models/rarity";
import { EnumParameter } from "../models/enum";
import { MediaFile } from "../models/mediafile";

export class ContractObjectCreator {

  makeRootContractObjectFromReq(req: Request) : Collection{

    let nameContract = req.body.nameContract;
    let tokenLimit = Number(req.body.tokenLimit);
    let icon = req.body.icon;

    let descriptCollection = new DescriptCollection(nameContract, tokenLimit, icon);

    let rarities : Rarity[] = [];
    let parametrs : Parametr[] = [];
    
    if (req.body.checkboxTypeRarity == '') {
      req.body.type.forEach(req_type => {
        let rarity = new Rarity(
          req_type.name,
          req_type.limit
        )
        rarities.push(rarity)
      });
    }

    if (req.body.selectpicker != 'none'){
      if (typeof(req.body.selectpicker) == 'string') {
        req.body.selectpicker = [req.body.selectpicker]
      }
      for (let index = 0; index < req.body.selectpicker.length; index++){
        let parameter : Parametr;

        if (req.body.selectpicker[index] == 'line'){
          parameter = new Parametr(
            req.body.parameter[index].name,
            'string',
            req.body.parameter[index].line.min,
            req.body.parameter[index].line.max
          );

        } else if (req.body.selectpicker[index] == 'number') {
          parameter = new Parametr(
            req.body.parameter[index].name,
            'uint',
            req.body.parameter[index].number.min,
            req.body.parameter[index].number.max
          );
          
        } else if (req.body.selectpicker[index] == 'mediafile') {
          parameter = new MediaFile(
            req.body.parameter[index].name,
            'string'
          )
        } else if (req.body.selectpicker[index] == 'enum') {
          parameter = new Parametr(
            'enum' + req.body.parameter[index].name,
            req.body.parameter[index].name
          )
        } else {
          parameter = new Parametr(
            req.body.parameter[index].name,
            'string' //Нужен тип по умолчанию если пользователь не выбрал
          );
        }

        parametrs.push(parameter)
      }
    }

    let collection : Collection = new Collection(descriptCollection, rarities, parametrs);

    return collection;
  }

  makeEnumsFromReq(req: Request) : EnumParameter[] {
    let enumParameters : EnumParameter[] = [];
    if (req.body.selectpicker != 'none') {
      if (typeof(req.body.selectpicker) == 'string') {
        req.body.selectpicker = [req.body.selectpicker]
      }
      for (let index = 0; index < req.body.selectpicker.length; index++) {
        if (req.body.selectpicker[index] == 'enum') {
          let enumVariants : string[] = [];
          if (typeof(req.body.parameter[index].enum) == 'string') {
            req.body.parameter[index].enum = [req.body.parameter[index].enum]
          }
          for (let i = 0; i < req.body.parameter[index].enum.length; i++) {
            enumVariants.push(req.body.parameter[index].enum[i]);
          }
          let enumParameter = new EnumParameter(
            req.body.parameter[index].name,
            enumVariants
          )
          enumParameters.push(enumParameter);
        }
      }
    }
    return enumParameters;
  }

  makeMediaFilesFromReq(req: Request) : MediaFile[] {
    let mediafiles : MediaFile[] = [];
    if (req.body.selectpicker != 'none') {
      if (typeof(req.body.selectpicker) == 'string') {
        req.body.selectpicker = [req.body.selectpicker]
      }
      for (let index = 0; index < req.body.selectpicker.length; index++) { 
        if (req.body.selectpicker[index] == 'mediafile') {
          let mediafile = new MediaFile(
            req.body.parameter[index].name,
            'string'
          )
          mediafiles.push(mediafile);
        }
      }
    }
    return mediafiles;
  }

  makeRootContractObjectFromJson(json) : Collection{

    let nameContract = json.description.name;
    let tokenLimit = json.description.name;
    let icon = json.description.name;

    let descriptCollection = new DescriptCollection(nameContract, tokenLimit, icon);

    let rarities : Rarity[] = [];
    let parametrs : Parametr[] = [];
    
    json.rarities.forEach(req_type => {
        let rarity = new Rarity(
          req_type.name,
          req_type.limit
        )
        rarities.push(rarity)
      });

    json.parameters.forEach(param => {
      let one_param = new Parametr(
        param.name,
        param.type,
        param.minValue,
        param.maxValue
      )
      parametrs.push(one_param)
    });
    
    let collection : Collection = new Collection(descriptCollection, rarities, parametrs);

    return collection;
  }

  makeEnumsFromJson(json) : EnumParameter[] {

    let enumParameters : EnumParameter[] = [];

    json.forEach(one_enum => {

      let enumVariants : string[] = [];

      one_enum.enumVariants.forEach(variant => {
        enumVariants.push(variant)
      })
      enumParameters.push(new EnumParameter(one_enum.name, enumVariants))
    });

    return enumParameters;
  }

  makeMediaFilesFromJson(json) : MediaFile[] {
    let mediafiles : MediaFile[] = [];
    
    json.forEach(mediafile => {
      mediafiles.push(new MediaFile(mediafile.name, mediafile.type))
    });
    
    return mediafiles;
  }

}