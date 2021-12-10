#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class LiquidNFTCollection(BaseContract):
    
    def __init__(self, tonClient: TonClient, nonce: str,
                                             ownerAddress: str,
                                             creatorAddress: str,
                                             collectionMetadataContents: str,
                                             tokenPrimarySaleHappened: bool,
                                             tokenMetadataIsMutable: bool,
                                             tokenMasterEditionMaxSupply: int,
                                             tokenMasterEditionPrintLocked: bool,
                                             tokenCreatorsPercent: int,
                                             tokenCreatorsShares,
                                             signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer
        self.CONSTRUCTOR = {"ownerAddress":                  ownerAddress, 
                            "creatorAddress":                creatorAddress,
                            "metadataContents":              collectionMetadataContents,
                            "tokenPrimarySaleHappened":      tokenPrimarySaleHappened,
                            "tokenMetadataIsMutable":        tokenMetadataIsMutable,
                            "tokenMasterEditionMaxSupply":   tokenMasterEditionMaxSupply,
                            "tokenMasterEditionPrintLocked": tokenMasterEditionPrintLocked,
                            "tokenCreatorsPercent":          tokenCreatorsPercent,
                            "tokenCreatorsShares":           tokenCreatorsShares}
        self.INITDATA    = {"_nonce":nonce, "_tokenCode":getCodeFromTvc("../bin/LiquidNFT.tvc")}
        BaseContract.__init__(self, tonClient=tonClient, contractName="LiquidNFTCollection", pubkey=ZERO_PUBKEY, signer=genSigner)

    #========================================
    #
    def changeOwner(self, msig: SetcodeMultisig, ownerAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="changeOwner", functionParams={"ownerAddress":ownerAddress}, value=DIME, flags=1)
        return result

    def createNFT(self, msig: SetcodeMultisig, ownerAddress: str, creatorAddress: str, metadataContents: str, metadataAuthorityAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="createNFT", functionParams={"ownerAddress":ownerAddress, 
                                                                                             "creatorAddress":creatorAddress, 
                                                                                             "metadataContents":metadataContents, 
                                                                                             "metadataAuthorityAddress":metadataAuthorityAddress}, value=DIME, flags=1)
        return result

    #========================================
    #
    def getInfo(self, includeMetadata: bool = True, includeTokenCode: bool = False):
        result = self._run(functionName="getInfo", functionParams={"includeMetadata":includeMetadata, "includeTokenCode":includeTokenCode})
        return result

# ==============================================================================
# 
