import { DEV_NETWORK, LOCAL_NETWORK, MAIN_NETWORK } from '../constants';
import { NetworksType } from './tonClient';

const checkIsValidNetwork = (network: string): false | NetworksType => {
    if (network === 'DEVNET'/*  || network === 'LOCAL' */ || network === 'MAINNET') {
        return network
    } else {
        return false
    }
}

export const getNetworkUrl = (network: NetworksType) => {
    if (network === 'DEVNET') return DEV_NETWORK
    //else if (network === 'LOCAL') return LOCAL_NETWORK
    else return MAIN_NETWORK
}

export default checkIsValidNetwork