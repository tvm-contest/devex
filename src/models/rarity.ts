
export class Rarity {
    private name : string;
    private limit : number; 

    constructor(name: string, limit: number) {
        this.name = name;
        this.limit = limit;
    }

    /******************
          Getters
    *******************/

    getName() : string {
        return this.name;
    }

    getLimit() : number {
        return this.limit;
    }
    
    /******************
          Setters
    *******************/

    setName(name: string) {
        this.name = name;
    }

    setLimit(limit: number) {
        this.limit = limit;
    }
    
}