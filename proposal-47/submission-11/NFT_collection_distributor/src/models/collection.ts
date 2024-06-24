import { DescriptCollection } from "./descript-collection";
import { Parametr } from "./parametr";
import { Rarity } from "./rarity";

export class Collection {
    private description: DescriptCollection;
    private rarities: Rarity[];
    private parameters: Parametr[];

    constructor(
        description: DescriptCollection, 
        rarities?: Rarity[],
        parameters?: Parametr[]
        ){
        this.description = description;
        this.rarities  = rarities ? rarities : [];
        this.parameters = parameters ? parameters : [];
    }

    addRarity(rarity: Rarity) {
        this.rarities.push(rarity);
    }

    addParametr(parametr: Parametr) {
        this.parameters.push(parametr);
    }

    popRarity() : Rarity | undefined {
        return this.rarities.pop();
    }

    popParametr() : Parametr | undefined {
        return this.parameters.pop();
    }

    /******************
        Getters
    *******************/

    getDescription() : DescriptCollection {
        return this.description;
    }

    getRarities() : Rarity[] {
        return this.rarities;
    }

    getParameters() : Parametr[] {
        return this.parameters;
    }
    
    /******************
        Setters
    *******************/

    setDescription(description: DescriptCollection) {
        this.description = description;
    }

    setRarities(rarities: Rarity[]) {
        this.rarities = rarities;
    }

    setParameters(parameters: Parametr[]) {
        this.parameters = parameters;
    }
   
}