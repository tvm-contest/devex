#!/usr/bin/env python3

# ==============================================================================
#
import freeton_utils
from   freeton_utils import *

class Distributor(BaseContract):
    def __init__(self, tonClient: TonClient, nonce: str, 
                                             creatorAddress: str,
                                             ownerAddress: str,
                                             ownerPubkey: str,
                                             treasuryAddress: str,
                                             presaleStartDate: int,
                                             saleStartDate: int,
                                             price: int,
                                             collectionMetadataContents: str,
                                             tokenPrimarySaleHappened: bool,
                                             tokenMetadataIsMutable: bool,
                                             tokenMasterEditionMaxSupply: int,
                                             tokenMasterEditionPrintLocked: bool,
                                             tokenCreatorsPercent: int,
                                             tokenCreatorsShares,
                                             signer: Signer = None):
        genSigner = generateSigner() if signer is None else signer

        self.CONSTRUCTOR = {"presaleStartDate":              presaleStartDate,
                            "saleStartDate":                 saleStartDate,
                            "price":                         price,
                            "collectionMetadataContents":    json.dumps(collectionMetadataContents),
                            "tokenPrimarySaleHappened":      tokenPrimarySaleHappened,
                            "tokenMetadataIsMutable":        tokenMetadataIsMutable,
                            "tokenMasterEditionMaxSupply":   tokenMasterEditionMaxSupply,
                            "tokenMasterEditionPrintLocked": tokenMasterEditionPrintLocked,
                            "tokenCreatorsPercent":          tokenCreatorsPercent,
                            "tokenCreatorsShares":           tokenCreatorsShares}
        self.INITDATA    = {"_nonce":          nonce, 
                            "_creatorAddress": creatorAddress, 
                            "_ownerAddress":   ownerAddress, 
                            "_ownerPubkey":    ownerPubkey, 
                            "_treasuryAddress":treasuryAddress, 
                            "_collectionCode": getCodeFromTvc("../bin/LiquidNFTCollection.tvc"), 
                            "_tokenCode":      getCodeFromTvc("../bin/LiquidNFT.tvc")}
        BaseContract.__init__(self, tonClient=tonClient, contractName="Distributor", pubkey=ZERO_PUBKEY, signer=genSigner)

    #========================================
    #
    def change(self, msig: Multisig, saleStartDate: int, presaleStartDate: int, price: int):
        result = self._callFromMultisig(msig=msig, functionName="change", functionParams={"saleStartDate":saleStartDate, "presaleStartDate":presaleStartDate, "price":price}, value=DIME, flags=1)
        return result

    def mint(self, msig: Multisig, value: int):
        result = self._callFromMultisig(msig=msig, functionName="mint", functionParams={}, value=value, flags=1)
        return result

    def mintInternal(self, msig: Multisig, targetOwnerAddress: str):
        result = self._callFromMultisig(msig=msig, functionName="mintInternal", functionParams={"targetOwnerAddress":targetOwnerAddress}, value=EVER, flags=1)
        return result

    def deleteWhitelist(self, msig: Multisig):
        result = self._callFromMultisig(msig=msig, functionName="deleteWhitelist", functionParams={}, value=DIME, flags=1)
        return result

    def deleteFromWhitelist(self, msig: Multisig, targetAddresses: List[str]):
        result = self._callFromMultisig(msig=msig, functionName="deleteFromWhitelist", functionParams={"targetAddresses":targetAddresses}, value=EVER, flags=1)
        return result

    def addToWhitelist(self, msig: Multisig, targetAddresses: List[str]):
        result = self._callFromMultisig(msig=msig, functionName="addToWhitelist", functionParams={"targetAddresses":targetAddresses}, value=EVER, flags=1)
        return result

    def deleteTokens(self, msig: Multisig):
        result = self._callFromMultisig(msig=msig, functionName="deleteTokens", functionParams={}, value=DIME, flags=1)
        return result

    def setToken(self, msig: Multisig, index: int, metadata: str):
        result = self._callFromMultisig(msig=msig, functionName="setToken", functionParams={"index":index, "metadata":metadata}, value=EVER, flags=1)
        return result

    def addTokens(self, msig: Multisig, metadatas: List[str]):
        result = self._callFromMultisig(msig=msig, functionName="addTokens", functionParams={"metadatas":metadatas}, value=EVER, flags=1)
        return result

    def lockTokens(self, msig: Multisig):
        result = self._callFromMultisig(msig=msig, functionName="lockTokens", functionParams={}, value=DIME, flags=1)
        return result
    
    #========================================
    #
    def getInfo(self, includeTokens: bool = False, includeWhitelist: bool = False):
        result = self._run(functionName="getInfo", functionParams={"includeTokens":includeTokens, "includeWhitelist":includeWhitelist})
        return result

# ==============================================================================
# 
