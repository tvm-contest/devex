#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class Service(BaseContract):
    
    def __init__(self, tonClient: TonClient, ownerAddress: str, signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer
        self.CONSTRUCTOR = {"ownerAddress":ownerAddress}
        BaseContract.__init__(self, tonClient=tonClient, contractName="Service", pubkey=genSigner.keys.public, signer=genSigner)

    def _callFromMultisig(self, msig: SetcodeMultisig, functionName, functionParams, value, flags):
        messageBoc = prepareMessageBoc(abiPath=self.ABI, functionName=functionName, functionParams=functionParams)
        result     = msig.callTransfer(addressDest=self.ADDRESS, value=value, payload=messageBoc, flags=flags)
        return result

    #========================================
    #
    def addSubscriptionPlan(self, msig: SetcodeMultisig, planID: int, period: int, periodPrice: int, value, flags):
        result = self._callFromMultisig(msig=msig, functionName="addSubscriptionPlan", functionParams={"planID":planID, "period":period, "periodPrice":periodPrice}, value=value, flags=flags)
        return result

    def removeSubscriptionPlan(self, msig: SetcodeMultisig, planID: int, value, flags):
        result = self._callFromMultisig(msig=msig, functionName="removeSubscriptionPlan", functionParams={"planID":planID}, value=value, flags=flags)
        return result
    
    #========================================
    #
    def getSubscriptionPlans(self):
        result = self._run(functionName="getSubscriptionPlans", functionParams={})
        return result


# ==============================================================================
# 
