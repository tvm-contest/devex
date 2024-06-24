
export type TypeCollection = {
    nameCollection: string
    limitCollection: number
}
export type ParamCollection = {
    typeParam: string
    MinLengthOrValue: number
    MaxLengthOrValue: number
}

export type RootContractForm = {
    nameContract: string
    tokenLimit: number
    collections: TypeCollection[]
    parameters: ParamCollection[]
} 

class RootContractFormHandler {

    rootContractFormHandler(rootContractForm: RootContractForm) : void {
        console.log(rootContractForm)
    }

}

export const { rootContractFormHandler } = new RootContractFormHandler()