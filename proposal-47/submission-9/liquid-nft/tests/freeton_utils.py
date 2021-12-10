#!/usr/bin/env python3

# ==============================================================================
# 
import base64
import time
import ast
from   tonclient.client import *
from   tonclient.types  import *
from   datetime import datetime
from   pprint import pprint

# ==============================================================================
# 
ZERO_PUBKEY   =   "0000000000000000000000000000000000000000000000000000000000000000"
ZERO_ADDRESS  = "0:0000000000000000000000000000000000000000000000000000000000000000"
EVER          = 1000000000
DIME          =  100000000
MSIG_GIVER    = ""
USE_GIVER     = True
THROW         = True

# ==============================================================================
# 
def getAbi(abiPath):
    abi = Abi.from_path(path=abiPath)
    return abi

def getTvc(tvcPath):
    fp  = open(tvcPath, 'rb')
    tvc = base64.b64encode(fp.read()).decode()
    fp.close()
    return tvc

def getAbiTvc(abiPath, tvcPath):
    return (getAbi(abiPath), getTvc(tvcPath))

# ==============================================================================
# 
def getApiEndpoints(testnet: bool):
    return ["https://net1.ton.dev", "https://net5.ton.dev"] if testnet else ["https://main2.ton.dev", "https://main3.ton.dev", "https://main4.ton.dev"]

# ==============================================================================
#
def stringToHex(inputString):
    return str(inputString).encode('utf-8').hex()

def hexToString(inputHex):
    return bytearray.fromhex(inputHex).decode()

# ==============================================================================
#
def getNowTimestamp():
    dt = datetime.now()
    unixtime = round(dt.timestamp())
    return unixtime

# ==============================================================================
#
emptyException = {"errorCode":0, "errorMessage":"", "transactionID": "", "errorDesc": ""}

def getValuesFromException(tonException: TonException):
    
    result = tonException.client_error.data

    try:
        errorCode = result["exit_code"]
    except KeyError:
        try:
            errorCode = result["local_error"]["data"]["exit_code"]
        except KeyError:
            errorCode = ""

    try:
        errorDesc = result["description"]
    except KeyError:
        errorDesc = ""

    try:
        transID = result["transaction_id"]
    except KeyError:
        transID = ""

    try:
        message = result["message"]
    except KeyError:
        try:
            message = result["local_error"]["message"]
        except KeyError:
            message = ""

    return {"errorCode":errorCode, "errorMessage":message, "transactionID": transID, "errorDesc": errorDesc}


# ==============================================================================
#
def getCodeFromTvc(tvcPath):

    tonClient     = TonClient(config=ClientConfig())
    tvc           = getTvc(tvcPath)
    tvcCodeParams = ParamsOfGetCodeFromTvc(tvc=tvc)
    tvcCodeResult = tonClient.boc.get_code_from_tvc(params=tvcCodeParams).code
    return tvcCodeResult

# ==============================================================================
#
def loadSigner(keysFile):
    if keysFile == "":
        signer = Signer.External(ZERO_PUBKEY)
    else:
        signer = Signer.Keys(KeyPair.load(keysFile, False))
    return signer

def generateSigner():
    keypair = TonClient(config=ClientConfig()).crypto.generate_random_sign_keys()
    signer  = Signer.Keys(keys=keypair)
    return signer

# ==============================================================================
#
def getAddress(abiPath, tvcPath, signer, initialPubkey, initialData):

    tonClient  = TonClient(config=ClientConfig())
    (abi, tvc) = getAbiTvc(abiPath, tvcPath)
    deploySet  = DeploySet(tvc=tvc, initial_pubkey=initialPubkey, initial_data=initialData)

    params     = ParamsOfEncodeMessage(abi=abi, signer=signer, deploy_set=deploySet)
    encoded    = tonClient.abi.encode_message(params=params)

    return encoded.address

# ==============================================================================
#
def getAddressZeroPubkey(abiPath, tvcPath, initialData):

    keys   = KeyPair(ZERO_PUBKEY, ZERO_PUBKEY)
    signer = Signer.Keys(keys)
    return getAddress(abiPath, tvcPath, signer, ZERO_PUBKEY, initialData)

# ==============================================================================
#
def prepareMessageBoc(abiPath, functionName, functionParams):

    tonClient = TonClient(config=ClientConfig())
    callSet   = CallSet(function_name=functionName, input=functionParams)
    params    = ParamsOfEncodeMessageBody(abi=getAbi(abiPath), signer=Signer.NoSigner(), is_internal=True, call_set=callSet)
    encoded   = tonClient.abi.encode_message_body(params=params)
    return encoded.body

# ==============================================================================
# 
def deployContract(tonClient: TonClient, abiPath, tvcPath, constructorInput, initialData, signer, initialPubkey):

    try:
        (abi, tvc)    = getAbiTvc(abiPath, tvcPath)
        callSet       = CallSet(function_name='constructor', input=constructorInput)
        deploySet     = DeploySet(tvc=tvc, initial_pubkey=initialPubkey, initial_data=initialData)
        params        = ParamsOfEncodeMessage(abi=abi, signer=signer, call_set=callSet, deploy_set=deploySet)
        encoded       = tonClient.abi.encode_message(params=params)

        messageParams = ParamsOfSendMessage(message=encoded.message, send_events=False, abi=abi)
        messageResult = tonClient.processing.send_message(params=messageParams)
        waitParams    = ParamsOfWaitForTransaction(message=encoded.message, shard_block_id=messageResult.shard_block_id, send_events=False, abi=abi)
        result        = tonClient.processing.wait_for_transaction(params=waitParams)

        return {"result": result, "exception": emptyException}

    except TonException as ton:
        if THROW:
            raise ton
        exceptionDetails = getValuesFromException(ton)
        return {"result": {}, "exception": exceptionDetails}

# ==============================================================================
#
def runFunctionInternal(tonClient: TonClient, boc: str, abiPath: str, contractAddress: str, functionName: str, functionParams):

    abi          = getAbi(abiPath)
    callSet      = CallSet(function_name=functionName, input=functionParams)
    params       = ParamsOfEncodeMessage(abi=abi, address=contractAddress, signer=Signer.NoSigner(), call_set=callSet)
    encoded      = tonClient.abi.encode_message(params=params)

    paramsRun    = ParamsOfRunTvm(message=encoded.message, account=boc, abi=abi)
    result       = tonClient.tvm.run_tvm(params=paramsRun)

    paramsDecode = ParamsOfDecodeMessage(abi=abi, message=result.out_messages[0])
    decoded      = tonClient.abi.decode_message(params=paramsDecode)

    if len(decoded.value) == 1 and list(decoded.value.keys())[0] == "value0":
        result = decoded.value["value0"]
    else:
        result = decoded.value

    return result

def runFunction(tonClient: TonClient, abiPath, contractAddress, functionName, functionParams):

    result = getAccountGraphQL(tonClient, contractAddress, "boc")
    if result == "":
        return ""
    if result["boc"] is None:
        return ""

    return (runFunctionInternal(tonClient=tonClient, boc=result["boc"], abiPath=abiPath, contractAddress=contractAddress, functionName=functionName, functionParams=functionParams))

# ==============================================================================
#
def callFunction(tonClient: TonClient, abiPath, contractAddress, functionName, functionParams, signer, waitForTransaction: bool = True):

    try:
        abi           = getAbi(abiPath)
        callSet       = CallSet(function_name=functionName, input=functionParams)
        params        = ParamsOfEncodeMessage(abi=abi, address=contractAddress, signer=signer, call_set=callSet)
        encoded       = tonClient.abi.encode_message(params=params)

        messageParams = ParamsOfSendMessage(message=encoded.message, send_events=False, abi=abi)
        messageResult = tonClient.processing.send_message(params=messageParams)

        if waitForTransaction:
            waitParams    = ParamsOfWaitForTransaction(message=encoded.message, shard_block_id=messageResult.shard_block_id, send_events=False, abi=abi)
            result        = tonClient.processing.wait_for_transaction(params=waitParams)
        else:
            result = ""

        #return (result, emptyException)
        return {"result": result, "exception": emptyException}

    except TonException as ton:
        if THROW:
            raise ton
        exceptionDetails = getValuesFromException(ton)
        #return ({}, exceptionDetails)
        return {"result": {}, "exception": exceptionDetails}

# ==============================================================================
#
def decodeMessageBody(boc, possibleAbiFiles):

    tonClient = TonClient(config=ClientConfig())

    # EXTERNAL
    for abi in possibleAbiFiles:
        try:
            params = ParamsOfDecodeMessageBody(abi=getAbi(abi), body=boc, is_internal=False)
            result = tonClient.abi.decode_message_body(params=params)
            return (abi, result)

        except TonException as ton:
            pass

    # INTERNAL
    for abi in possibleAbiFiles:
        try:
            params = ParamsOfDecodeMessageBody(abi=getAbi(abi), body=boc, is_internal=True)
            result = tonClient.abi.decode_message_body(params=params)
            return (abi, result)

        except TonException as ton:
            pass

    return ("", "")

# ==============================================================================
#
def getAccountsInternalGraphQL(tonClient: TonClient, accountIDsArray, fields: str, limit: int):

    paramsCollection = ParamsOfQueryCollection(
    collection="accounts", result=fields, limit=limit,
    filter={"id":{"in":accountIDsArray}},
    order=[OrderBy(path='id', direction=SortDirection.DESC)])

    result = tonClient.net.query_collection(params=paramsCollection)
    return result.result

def getAccountGraphQL(tonClient: TonClient, accountID, fields):

    result = getAccountsInternalGraphQL(tonClient=tonClient, accountIDsArray=[accountID], fields=fields, limit=1)
    if len(result) > 0:
        return result[0]
    else:
        return ""

# ==============================================================================
#
def getMessageGraphQL(tonClient: TonClient, messageID, fields):

    paramsCollection = ParamsOfQueryCollection(
    collection="messages", result=fields, limit=1,
    filter={"id":{"eq":messageID}})

    result = tonClient.net.query_collection(params=paramsCollection)
    if len(result.result) > 0:
        return result.result[0]
    else:
        return ""
    
    #paramsQuery = ParamsOfQuery(query="query($msg: String){messages(filter:{id:{eq:$msg}}){" + fields + "}}", variables={"msg": messageID})
    #result      = tonClient.net.query(params=paramsQuery)
    
    #if len(result.result["data"]["messages"]) > 0:
    #    return result.result["data"]["messages"][0]
    #else:
    #    return ""

def getTransactionGraphQL(tonClient: TonClient, messageID, fields):

    paramsCollection = ParamsOfQueryCollection(
    collection="transactions", result=fields, limit=1,
    filter={"in_msg":{"eq":messageID}})

    result = tonClient.net.query_collection(params=paramsCollection)
    if len(result.result) > 0:
        return result.result[0]
    else:
        return ""

    #paramsQuery = ParamsOfQuery(query="query($msg: String){transactions(filter:{in_msg:{eq:$msg}}){" + fields + "}}", variables={"msg": messageID})
    #result      = tonClient.net.query(params=paramsQuery)

    #if len(result.result["data"]["transactions"]) > 0:
    #    return result.result["data"]["transactions"][0]
    #else:
    #    return ""

# ==============================================================================
#
def getExitCodeFromMessageID(tonClient: TonClient, messageID, fields):
    result       = getTransactionGraphQL(tonClient, messageID, fields)
    realExitCode = result["compute"]["exit_code"]
    return realExitCode

# ==============================================================================
#
def unwrapMessages(tonClient: TonClient, messageIdArray, abiFilesArray):

    arrayMsg    = []
    abiRegistry = []
    msgFilters  = "id, src, dst, body, dst_transaction{id}, value(format:DEC), ihr_fee(format:DEC), import_fee(format:DEC), fwd_fee(format:DEC)"
    txFilters   = "id, status, status_name, end_status, out_msgs, outmsg_cnt, aborted, compute{exit_arg, exit_code, skipped_reason, skipped_reason_name, gas_fees(format:DEC)}, total_fees(format:DEC), storage{storage_fees_collected(format:DEC)}"

    for abi in abiFilesArray:
        abiRegistry.append(getAbi(abi))

    for initialMsg in messageIdArray:
        treeParams = ParamsOfQueryTransactionTree(in_msg=initialMsg, abi_registry=abiRegistry)
        treeResult = tonClient.net.query_transaction_tree(params=treeParams)

        for msg in treeResult.messages:
            resultMsg            = getMessageGraphQL(tonClient, msg.id, msgFilters)
            resultTx             = getTransactionGraphQL(tonClient, msg.id, txFilters)
            (abi, resultMsgBody) = decodeMessageBody(resultMsg["body"], abiFilesArray)

            elm = [{
                "SOURCE":             resultMsg["src"],
                "DEST":               resultMsg["dst"] if resultMsg["dst"] != "" else "---",
                "VALUE":              resultMsg["value"],
                "FEES":               {"ihr_fee":resultMsg["ihr_fee"], "import_fee":resultMsg["import_fee"], "fwd_fee":resultMsg["fwd_fee"]},
                "MESSAGE_ID:":        msg.id,
                "PARENT_TX_ID:":      msg.src_transaction_id,
                "TARGET_ABI":         abi,
                "CALL_TYPE":          resultMsgBody.body_type if resultMsgBody != "" else "---",
                "FUNCTION_NAME":      resultMsgBody.name      if resultMsgBody != "" else "---",
                "FUNCTION_PARAMS":    resultMsgBody.value     if resultMsgBody != "" else "---",
                "MSG_HEADER":         resultMsgBody.header    if resultMsgBody != "" else "---",
                "OUT_MSGS":           resultTx["out_msgs"]    if resultTx      != "" else [],
                "OUT_MSG_CNT":        resultTx["outmsg_cnt"]  if resultTx      != "" else 0,
                "TX_DETAILS":         resultTx                if resultTx      != "" else "---"
            }]
            arrayMsg += elm

    return arrayMsg

# ==============================================================================
#
class BaseContract(object):
    def __init__(self, tonClient: TonClient, contractName: str, signer: Signer, pubkey: str = ZERO_PUBKEY):
        self.SIGNER      = signer
        self.TONCLIENT   = tonClient
        self.ABI         = "../bin/" + contractName + ".abi.json"
        self.TVC         = "../bin/" + contractName + ".tvc"
        self.CONSTRUCTOR = {} if not hasattr(self, "CONSTRUCTOR") else self.CONSTRUCTOR
        self.INITDATA    = {} if not hasattr(self, "INITDATA")    else self.INITDATA
        self.PUBKEY      = pubkey
        self.ADDRESS     = getAddress(abiPath=self.ABI, tvcPath=self.TVC, signer=self.SIGNER, initialPubkey=self.PUBKEY, initialData=self.INITDATA)
    
    # ========================================
    #
    def deploy(self):
        result = deployContract(tonClient=self.TONCLIENT, abiPath=self.ABI, tvcPath=self.TVC, constructorInput=self.CONSTRUCTOR, initialData=self.INITDATA, signer=self.SIGNER, initialPubkey=self.PUBKEY)
        return result

    def _call(self, functionName, functionParams, signer):
        result = callFunction(tonClient=self.TONCLIENT, abiPath=self.ABI, contractAddress=self.ADDRESS, functionName=functionName, functionParams=functionParams, signer=signer)
        return result

    def _run(self, functionName, functionParams):
        result = runFunction(tonClient=self.TONCLIENT, abiPath=self.ABI, contractAddress=self.ADDRESS, functionName=functionName, functionParams=functionParams)
        return result

    def _callFromMultisig(self, msig, functionName, functionParams, value, flags, bounce=True):
        messageBoc = prepareMessageBoc(abiPath=self.ABI, functionName=functionName, functionParams=functionParams)
        result     = msig.sendTransaction(addressDest=self.ADDRESS, value=value, bounce=bounce, payload=messageBoc, flags=flags)
        return result

    def getBalance(self):
        result = getAccountGraphQL(tonClient=self.TONCLIENT, accountID=self.ADDRESS, fields="balance(format:DEC)")
        return int(result["balance"]) if result != "" else 0

    # 0 – uninit
    # 1 – active
    # 2 – frozen
    # 3 – nonExist
    def getAccType(self):
        result = getAccountGraphQL(tonClient=self.TONCLIENT, accountID=self.ADDRESS, fields="acc_type")
        return int(result["acc_type"]) if result != "" else 0

# ==============================================================================
#
class Multisig(BaseContract):
    def __init__(self, tonClient: TonClient, signer: Signer = None):
        msigSigner = generateSigner() if signer is None else signer

        BaseContract.__init__(self, tonClient=tonClient, contractName="SetcodeMultisigWallet", pubkey=msigSigner.keys.public, signer=msigSigner)
        self.CONSTRUCTOR = {"owners":["0x" + self.SIGNER.keys.public],"reqConfirms":"1"}

    def sendTransaction(self, addressDest, value, bounce, payload, flags):
        result = self._call(functionName="sendTransaction", functionParams={"dest":addressDest, "value":value, "bounce":bounce, "flags":flags, "payload":payload}, signer=self.SIGNER)
        return result

# ==============================================================================
#
class Giver(BaseContract):
    def __init__(self, tonClient: TonClient):
        self.ADDRESS = "0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94"
        self.ABI     = "../bin/local_giver.abi.json"
        self.SIGNER  = Signer.NoSigner()

    def sendGrams(self, dest, amount):
        result = self._call(functionName="sendGrams", functionParams={"dest":dest,"amount":amount}, signer=Signer.NoSigner())
        return result


# ==============================================================================
#

class SetcodeMultisig(object):
    def __init__(self, tonClient: TonClient, signer: Signer = None):
        self.SIGNER      = generateSigner() if signer is None else signer
        self.TONCLIENT   = tonClient
        self.ABI         = "../bin/SetcodeMultisigWallet.abi.json"
        self.TVC         = "../bin/SetcodeMultisigWallet.tvc"
        self.CONSTRUCTOR = {"owners":["0x" + self.SIGNER.keys.public],"reqConfirms":"1"}
        self.INITDATA    = {}
        self.PUBKEY      = self.SIGNER.keys.public
        self.ADDRESS     = getAddress(abiPath=self.ABI, tvcPath=self.TVC, signer=self.SIGNER, initialPubkey=self.SIGNER.keys.public, initialData=self.INITDATA)

    def deploy(self):
        result = deployContract(tonClient=self.TONCLIENT, abiPath=self.ABI, tvcPath=self.TVC, constructorInput=self.CONSTRUCTOR, initialData=self.INITDATA, signer=self.SIGNER, initialPubkey=self.PUBKEY)
        return result

    def call(self, functionName, functionParams):
        result = callFunction(tonClient=self.TONCLIENT, abiPath=self.ABI, contractAddress=self.ADDRESS, functionName=functionName, functionParams=functionParams, signer=self.SIGNER)
        return result

    def callTransfer(self, addressDest, value, payload, flags):
        result = self.call(functionName="sendTransaction", functionParams={"dest":addressDest, "value":value, "bounce":False, "flags":flags, "payload":payload})
        return result

    def run(self, functionName, functionParams):
        result = runFunction(tonClient=self.TONCLIENT, abiPath=self.ABI, contractAddress=self.ADDRESS, functionName=functionName, functionParams=functionParams)
        return result

    def destroy(self, addressDest):
        result = callFunction(tonClient=self.TONCLIENT, abiPath=self.ABI, contractAddress=self.ADDRESS, functionName="sendTransaction", functionParams={"dest":addressDest, "value":0, "bounce":False, "flags":128+32, "payload":""}, signer=self.SIGNER)
        return result


# ==============================================================================
#
def giverGetAddress():

    global MSIG_GIVER

    if MSIG_GIVER == "":
        return "0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94"
    else:
        signer = loadSigner(MSIG_GIVER)
        msig   = SetcodeMultisig(tonClient=TonClient(config=ClientConfig()), signer=signer)
        return msig.ADDRESS

def giverGive(tonClient: TonClient, contractAddress, amountTons):
    
    if not USE_GIVER:
        print("\nNow GIVER expects to give {} TONs to address {};".format(amountTons, contractAddress))
        input("Please, do it manually and then press ENTER to continue...")
        return

    global MSIG_GIVER
    if MSIG_GIVER == "":
        giverAddress = giverGetAddress()
        callFunction(tonClient, "../bin/local_giver.abi.json", giverAddress, "sendGrams", {"dest":contractAddress,"amount":amountTons}, Signer.NoSigner())
    else:
        signer = loadSigner(MSIG_GIVER)
        msig   = SetcodeMultisig(signer=signer)
        msig.callTransfer(addressDest=contractAddress, value=amountTons, payload="", flags=1)

# ==============================================================================
#
