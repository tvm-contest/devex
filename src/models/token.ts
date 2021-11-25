import { Collection } from "./collection";
import { Parametr } from "./parametr";
import { Rarity } from "./rarity";

export class Token {
    private collection: Collection;
    private parameters: Parametr[];
    private rarity: Rarity | null;

    constructor(
        collection: Collection, 
        parameters?: Parametr[], 
        rarity?: Rarity
        ) {
        this.collection = collection;
        this.parameters = parameters ? parameters : [];
        this.rarity = rarity ? rarity : null;
    }

    addParametr(parametr: Parametr) {
        this.parameters.push(parametr);
    }

    popParametr() : Parametr | undefined {
        return this.parameters.pop();
    }

    /******************
        Getters
    *******************/

    getCollection() : Collection {
        return this.collection;
    }

    getRarities() : Parametr[] {
        return this.parameters;
    }

    getParameters() : Rarity | null {
        return this.rarity;
    }

    /******************
        Setters
    *******************/

    setCollection(collection: Collection) {
        this.collection = collection;
    }

    setRarities(parameters: Parametr[]) {
        this.parameters = parameters;
    }

    setParameters(rarity: Rarity | null) {
        this.rarity = rarity;
    }
}