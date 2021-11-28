import { Request } from "express";
import { Collection } from "../models/collection";
import { DescriptCollection } from "../models/descript-collection";
import { Parametr } from "../models/parametr";
import { Rarity } from "../models/rarity";

export class ContractObjectCreator {

  makeRootContractObjectFromReq(req: Request) : Collection{

    let nameContract = req.body.nameContract;
    let tokenLimit = req.body.tokenLimit;
    let icon = req.body.icon;

    let descriptCollection = new DescriptCollection(nameContract, tokenLimit, icon);

    let rarities : Rarity[] = [];
    let parametrs : Parametr[] = [];

    //если был только один тип то в req будет строка, если несколько,то массив
    if (typeof req.body.typeName === 'object') {
      for (let index = 0; index < req.body.typeName.length; index++) {
        let rarity : Rarity = new Rarity(
          req.body.typeName[index],
          req.body.typeLimit[index],
        )
        rarities.push(rarity)    
      }
    } else if (req.body.typeName) {
      let rarity : Rarity = new Rarity(
        req.body.typeName,
        req.body.typeLimit,
      )
      rarities.push(rarity) 
    }
    //Хотелось бы избавиться от повтерения кода, но идей как это сделать нет
    if (typeof req.body.paramName === 'object') {
      for (let index = 0; index < req.body.paramName.length; index++) {
        let parametr : Parametr = new Parametr(
          req.body.paramName[index],
          req.body.paramType[index],
        )
        parametrs.push(parametr)    
      }
    } else if (req.body.paramName) {
      let parametr : Parametr = new Parametr(
        req.body.paramName,
        req.body.paramType,
      )
      parametrs.push(parametr) 
    }

    let collection : Collection = new Collection(descriptCollection, rarities, parametrs);

    return collection;
  }

}