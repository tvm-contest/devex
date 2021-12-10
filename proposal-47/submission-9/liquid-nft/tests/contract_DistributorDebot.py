#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class DistributorDebot(BaseContract):
    
    def __init__(self, tonClient: TonClient, ownerAddress: str, distributorAddress: str, signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer
        self.CONSTRUCTOR = {"ownerAddress":ownerAddress, "distributorAddress":distributorAddress}
        BaseContract.__init__(self, tonClient=tonClient, contractName="DistributorDebot", pubkey=genSigner.keys.public, signer=genSigner)

    # ========================================
    #
    def setDistributorAddress(self, msig: Multisig, value: int, distributorAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="setDistributorAddress", functionParams={"distributorAddress":distributorAddress}, value=value, flags=1)
        return result

    def setABI(self, msig: Multisig, value: int):
        result = self._callFromMultisig(msig=msig, functionName="setABI", functionParams={"dabi":stringToHex(getAbi(self.ABI).value)}, value=value, flags=1)
        return result
    
    def setIcon(self, msig: Multisig, icon: str, value: int):
        result = self._callFromMultisig(msig=msig, functionName="setIcon", functionParams={"icon":stringToHex(icon)}, value=value, flags=1)
        return result

    def upgrade(self, msig: Multisig, state: str, value: int):
        result = self._callFromMultisig(msig=msig, functionName="upgrade", functionParams={"state":state}, value=value, flags=1)
        return result
    
    #========================================
    #
    

# ==============================================================================
# 
