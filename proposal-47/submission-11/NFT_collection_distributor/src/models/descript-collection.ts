
export class DescriptCollection {
    private name : string;
    private limit : number; 
    private icon : string | null; //не уверен что именно тут хранится (путь или base64) но string подходит в обоих случаях

    constructor(name: string, limit: number, icon?: string) {
        this.name = name;
        this.limit = limit;
        this.icon = icon ? icon : null;
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

    getIcon() : string | null {
        return this.icon;
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

    setIcon(icon: string) {
        this.icon = icon;
    }
}