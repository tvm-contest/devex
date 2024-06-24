import { Parametr } from "./parametr";

export class EnumParameter extends Parametr{
    private enumVariants : string[];

    constructor(EnumName: string, enumVariants: string[]) {
        super(EnumName, 'enum');
        this.enumVariants = enumVariants;
    }

    /******************
          Getters
    *******************/

    getEnumVariants() : string[] {
        return this.enumVariants;
    }

    /******************
          Setters
    *******************/

    setEnumVariants(enumVariants: string[]) : void {
        this.enumVariants = enumVariants;
    }
}