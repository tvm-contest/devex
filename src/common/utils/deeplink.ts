import clientController from "./tonClient";
import { Account, ContractPackage } from '@tonclient/appkit';
import { AbiContract, ResultOfRunExecutor } from "@tonclient/core";
import encodeString from "./encodeString";
import dEngine from "../../DEngine";

export type QRDetails = {
    messageGeneratorAddr: string,
    functionName: string,
    signerAddr: string
}

export const getDeepLink = async (payload: string, details: QRDetails) => {
    const initParams = dEngine.storage.get(details.messageGeneratorAddr) || await dEngine.initDebot(details.messageGeneratorAddr)
    const tonPackage: ContractPackage = { abi: '', tvc: '' } as ContractPackage
    if (initParams) {
        tonPackage.abi = JSON.parse(initParams.debot_abi)
        try {
            const graphqlResult = await clientController.client.net.query_collection({
                collection: "accounts",
                filter: {
                    id: {
                        eq: details.messageGeneratorAddr
                    }
                },
                result: "code"
            })
            tonPackage.tvc = graphqlResult.result[0].code
        } catch (error: any) {
            console.error(error)
            alert(error)
        }
    }

    const debot: Account = new Account(tonPackage, {
        address: details.messageGeneratorAddr,
        client: clientController.client
    });
    const message: string = await debot
        .runLocal(details.functionName, {
            value: encodeString(payload),
            dest: details.signerAddr
        })
        .then((result: ResultOfRunExecutor) =>
            result.decoded?.output.message
                .replace(/\//g, '_')
                .replace(/\+/g, '-')
                .replace(/=/g, '')
        )
        .catch(err => console.log('generateMessage err: ', err));
    return `https://uri.ton.surf/debot/${details.signerAddr}?net=devnet&message=${message}`
}
