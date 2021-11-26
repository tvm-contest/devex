
export class Parametr {
    private name : string;
    private type : string;
    private value : any | null;

    constructor(name: string, type: string, value?:any) {
        this.name = name;
        this.type = type;
        this.value = value ? value : null;
    }

    /******************
          Getters
    *******************/

    getName() : string {
        return this.name;
    }

    getType() : string {
        return this.type;
    }

    getValue() : any | null {
        return this.value;
    }
    
    /******************
          Setters
    *******************/

    setName(name: string) {
        this.name = name;
    }

    setType(type: string) {
        this.type = type;
    }

    setValue(value: any) {
        this.value = value;
    }
}