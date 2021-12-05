import { Request } from "express";
import { Collection } from "../models/collection";
import { DescriptCollection } from "../models/descript-collection";
import { Parametr } from "../models/parametr";
import { Rarity } from "../models/rarity";

export class ContractObjectCreator {

  makeRootContractObjectFromReq(req: Request) : Collection{

    let nameContract = req.body.nameContract;
    let tokenLimit = Number(req.body.tokenLimit);
    let icon = req.body.icon;

    let descriptCollection = new DescriptCollection(nameContract, tokenLimit, icon);

    let rarities : Rarity[] = [];
    let parametrs : Parametr[] = [];

    req.body.type.forEach(one_type => {
      let rarity = new Rarity(
        one_type.name,
        one_type.limit
      )
      rarities.push(rarity)
    });

    //Предполагалось что параметры будут передаваться через paramName, paramType , но так как
    //еще есть ограничения на параметры то код ниже не работает так как надо
    // if (typeof req.body.paramName === 'object') {
    //   for (let index = 0; index < req.body.paramName.length; index++) {
    //     let parametr : Parametr = new Parametr(
    //       req.body.paramName[index],
    //       req.body.paramType[index],
    //     )
    //     parametrs.push(parametr)    
    //   }
    // } else if (req.body.paramName) {
    //   let parametr : Parametr = new Parametr(
    //     req.body.paramName,
    //     req.body.paramType,
    //   )
    //   parametrs.push(parametr) 
    // }

    let collection : Collection = new Collection(descriptCollection, rarities, parametrs);

    return collection;
  }

}