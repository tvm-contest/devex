#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class SubscribeMultisig(BaseContract):
    def __init__(self, tonClient: TonClient, signer: Signer = None):
        ssigSigner = generateSigner() if signer is None else signer
        self.CONSTRUCTOR = {"owners":["0x" + ssigSigner.keys.public],"reqConfirms":"1"}
        self.INITDATA    = {"_subscriptionCode":getCodeFromTvc(tvcPath="../bin/Subscription.tvc")}
        BaseContract.__init__(self, tonClient=tonClient, contractName="SubscribeMultisig", pubkey=ssigSigner.keys.public, signer=ssigSigner)

    #========================================
    #
    def sendTransaction(self, addressDest, value, payload, flags):
        result = self._call(functionName="sendTransaction", functionParams={"dest":addressDest, "value":value, "bounce":False, "flags":flags, "payload":payload})
        return result

    def createSubscription(self, serviceAddress: str, planID: int, period: int, periodPrice: int):
        result = self._call(functionName="createSubscription", functionParams={"serviceAddress":serviceAddress, "planID":planID, "period":period, "periodPrice":periodPrice}, signer=self.SIGNER)
        return result


# ==============================================================================
# 
