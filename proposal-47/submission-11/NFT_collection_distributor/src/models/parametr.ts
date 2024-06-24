
export class Parametr {
    private name : string;
    private type : string;
    private minValue : any | null;
    private maxValue : any | null;

    constructor(name: string, type: string, minValue?:any, maxValue?:any) {
        this.name = name;
        this.type = type;
        this.minValue = minValue ? minValue : null;
        this.maxValue = maxValue ? maxValue : null;
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

    getMinValue() : any | null {
        return this.minValue;
    }

    getMaxValue() : any | null {
        return this.maxValue;
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

    setMinValue(value: any) {
        this.minValue = value;
    }

    setMaxValue(value: any) {
        this.maxValue = value;
    }
}