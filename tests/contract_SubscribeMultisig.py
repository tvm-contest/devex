#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class SubscribeMultisig(BaseContract):
    def __init__(self, tonClient: TonClient, signer: Signer = None):
        msigSigner = generateSigner() if signer is None else signer

        BaseContract.__init__(self, tonClient=tonClient, contractName="SubscribeMultisig", pubkey=msigSigner.keys.public, signer=msigSigner)
        self.CONSTRUCTOR = {"owners":["0x" + self.SIGNER.keys.public],"reqConfirms":"1"}
        self.ADDRESS     = getAddress(abiPath=self.ABI, tvcPath=self.TVC, signer=self.SIGNER, initialPubkey=self.PUBKEY, initialData=self.INITDATA)

    #========================================
    #
    def sendTransaction(self, addressDest, value, payload, flags):
        result = self._call(functionName="sendTransaction", functionParams={"dest":addressDest, "value":value, "bounce":False, "flags":flags, "payload":payload})
        return result

    def createSubscription(self, serviceAddress: int, planID: int, period: int, periodPrice: int):
        result = self._call(functionName="createSubscription", functionParams={"serviceAddress":serviceAddress, "planID":planID, "period":period, "periodPrice":periodPrice})
        return result


# ==============================================================================
# 
