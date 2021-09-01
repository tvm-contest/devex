#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *


class SubscriptionDebot(BaseContract):
    
    def __init__(self, tonClient: TonClient, ownerAddress: str, signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer
        self.CONSTRUCTOR = {"ownerAddress":ownerAddress}
        BaseContract.__init__(self, tonClient=tonClient, contractName="SubscriptionDebot", pubkey=genSigner.keys.public, signer=genSigner)

    def _callFromMultisig(self, msig: SetcodeMultisig, functionName, functionParams, value, flags):
        messageBoc = prepareMessageBoc(abiPath=self.ABI, functionName=functionName, functionParams=functionParams)
        result     = msig.callTransfer(addressDest=self.ADDRESS, value=value, payload=messageBoc, flags=flags)
        return result

    #========================================
    #
    def setSsigCode(self, msig: SetcodeMultisig, value: int, code: str):
        result = self._callFromMultisig(msig=msig, functionName="setSsigCode", functionParams={"code":code}, value=value, flags=1)
        return result
    
    def setSubscriptionCode(self, msig: SetcodeMultisig, value: int, code: str):
        result = self._callFromMultisig(msig=msig, functionName="setSubscriptionCode", functionParams={"code":code}, value=value, flags=1)
        return result
    
    def setABI(self, msig: SetcodeMultisig, value: int):
        result = self._callFromMultisig(msig=msig, functionName="setABI", functionParams={"dabi":stringToHex(getAbi(self.ABI).value)}, value=value, flags=1)
        return result
        
    def addService(self, msig: SetcodeMultisig, value: int, serviceName: str, serviceAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="addService", functionParams={"serviceName":serviceName, "serviceAddress":serviceAddress}, value=value, flags=1)
        return result
        
    def clearServices(self, msig: SetcodeMultisig, value: int):
        result = self._callFromMultisig(msig=msig, functionName="clearServices", functionParams={}, value=value, flags=1)
        return result


# ==============================================================================
# 
