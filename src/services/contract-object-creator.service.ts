import { Request } from "express";
import { Collection } from "../models/collection";
import { DescriptCollection } from "../models/descript-collection";
import { Parametr } from "../models/parametr";
import { Rarity } from "../models/rarity";
import { EnumParameter } from "../models/enum";

export class ContractObjectCreator {

  makeRootContractObjectFromReq(req: Request) : Collection{

    let nameContract = req.body.nameContract;
    let tokenLimit = Number(req.body.tokenLimit);
    let icon = req.body.icon;

    let descriptCollection = new DescriptCollection(nameContract, tokenLimit, icon);

    let rarities : Rarity[] = [];
    let parametrs : Parametr[] = [];

    req.body.type.forEach(req_type => {
      let rarity = new Rarity(
        req_type.name,
        req_type.limit
      )
      rarities.push(rarity)
    });

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
            'int',
            req.body.parameter[index].number.min,
            req.body.parameter[index].number.max
          );
          
        } else if (req.body.selectpicker[index] == 'enum') {
          parameter = new Parametr(
            'enum' + req.body.parameter[index].name + index,
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
        let enumParameter : EnumParameter;
        if (req.body.selectpicker[index] == 'enum') {
          let enumVariants : string[] = [];
          if (typeof(req.body.parameter[index].enum) == 'string') {
            req.body.parameter[index].enum = [req.body.parameter[index].enum]
          }
          for (let i = 0; i < req.body.parameter[index].enum.length; i++) {
            enumVariants.push(req.body.parameter[index].enum[i]);
          }
          enumParameter = new EnumParameter(
            req.body.parameter[index].name,
            enumVariants
          )
          enumParameters.push(enumParameter);
        }
      }
    }
    return enumParameters;
  }

}