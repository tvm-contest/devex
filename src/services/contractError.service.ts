import { TonClient } from "@tonclient/core";

class ContractErrorService {

    async checkErrorMessage(transaction: any, client: TonClient) : Promise<number> {
        let { result } = await client.net.query({
            query: "{transactions(filter:{in_msg:{eq:\"" + transaction.out_msgs[0] + "\"}}) {id}}"
        });
        let exit_code = (await client.net.query({
            query: "{transactions(filter:{id:{eq:\"" + result.data.transactions[0].id + "\"}}){compute{exit_code}}}"
        })).result.data.transactions[0].compute.exit_code;
        return exit_code;
    }
}

export const { checkErrorMessage } = new ContractErrorService();