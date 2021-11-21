
export type TypeCollection = {
    nameCollection: string
    limitCollection: number
}

export type RootContractForm = {
    nameContract: string
    tokenLimit: number
    collections: TypeCollection[]
} 

class RootContractFormHandler {

    rootContractFormHandler(rootContractForm: RootContractForm) : void {
        console.log(rootContractForm)
    }

}

export const { rootContractFormHandler } = new RootContractFormHandler()