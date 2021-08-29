#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class Subscription(BaseContract):
    
    def __init__(self, tonClient: TonClient, ownerAddress: str, signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer

        BaseContract.__init__(self, tonClient=tonClient, contractName="Subscription", pubkey=genSigner.keys.public, signer=genSigner)
        self.CONSTRUCTOR = {"ownerAddress":ownerAddress}
        self.ADDRESS     = getAddress(abiPath=self.ABI, tvcPath=self.TVC, signer=self.SIGNER, initialPubkey=self.PUBKEY, initialData=self.INITDATA)

    def _callFromMultisig(self, msig: SetcodeMultisig, functionName, functionParams, value, flags):
        messageBoc = prepareMessageBoc(abiPath=self.ABI, functionName=functionName, functionParams=functionParams)
        result     = msig.callTransfer(addressDest=self.ADDRESS, value=value, payload=messageBoc, flags=flags)
        return result

    #========================================
    #
    def createSubscription(self, msig: SetcodeMultisig, subscriptionPlan: int, period: int, periodPrice: int, value, flags):
        result = self._callFromMultisig(msig=msig, functionName="createSubscription", functionParams={"subscriptionPlan":subscriptionPlan, "period":period, "periodPrice":periodPrice}, value=value, flags=flags)
        return result

    def payForSubscription(self, msig: SetcodeMultisig, value, flags):
        result = self._callFromMultisig(msig=msig, functionName="payForSubscription", functionParams={}, value=value, flags=flags)
        return result

    def cancelSubscription(self, msig: SetcodeMultisig, value, flags):
        result = self._callFromMultisig(msig=msig, functionName="cancelSubscription", functionParams={}, value=value, flags=flags)
        return result
    
    #========================================
    #
    def getInfo(self):
        result = self._run(functionName="getInfo", functionParams={})
        return result


# ==============================================================================
# 
