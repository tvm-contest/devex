export type NftToken = {
    name: string
    limit: number
}

export type TokensInfoForm = {
    collectionName: string
    nftTokens: NftToken[]
} 

class TokensInfoFormHandler {

    tokensInfoFormHandler(tokensInfoForm: TokensInfoForm) : void {
        var fs = require('fs');
        fs.writeFile("tokensInfo.txt", JSON.stringify(tokensInfoForm), function(err) {
            if (err) {
                console.log(err);
            }
        });
        console.log(tokensInfoForm)
    }

}

export const { tokensInfoFormHandler } = new TokensInfoFormHandler()
