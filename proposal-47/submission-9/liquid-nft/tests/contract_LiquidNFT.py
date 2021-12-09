#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class LiquidNFT(BaseContract):
    
    def __init__(self, tonClient: TonClient, collectionAddress: str, tokenID: int, editionNumber: int, signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer
        self.CONSTRUCTOR = {}
        self.INITDATA    = {"_collectionAddress":collectionAddress, "_tokenID":tokenID, "_editionNumber":editionNumber}
        BaseContract.__init__(self, tonClient=tonClient, contractName="LiquidNFT", pubkey=ZERO_PUBKEY, signer=genSigner)

    #========================================
    #
    def changeOwner(self, msig: SetcodeMultisig, ownerAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="changeOwner", functionParams={"ownerAddress":ownerAddress}, value=DIME, flags=1)
        return result

    def changeOwnerWithPrimarySale(self, msig: SetcodeMultisig, ownerAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="changeOwnerWithPrimarySale", functionParams={"ownerAddress":ownerAddress}, value=DIME, flags=1)
        return result

    def updateMetadata(self, msig: SetcodeMultisig, metadataContents: str):
        result = self._callFromMultisig(msig=msig, functionName="updateMetadata", functionParams={"metadataContents":metadataContents}, value=DIME, flags=1)
        return result

    def lockMetadata(self, msig: SetcodeMultisig):
        result = self._callFromMultisig(msig=msig, functionName="lockMetadata", functionParams={}, value=DIME, flags=1)
        return result

    def printCopy(self, msig: SetcodeMultisig, targetOwnerAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="printCopy", functionParams={"targetOwnerAddress":targetOwnerAddress}, value=DIME, flags=1)
        return result

    def lockPrint(self, msig: SetcodeMultisig):
        result = self._callFromMultisig(msig=msig, functionName="lockPrint", functionParams={}, value=DIME, flags=1)
        return result
    
    #========================================
    #
    def getInfo(self, includeMetadata: bool = True):
        result = self._run(functionName="getInfo", functionParams={"includeMetadata":includeMetadata})
        return result

# ==============================================================================
# 
