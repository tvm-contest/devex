#!/usr/bin/env python3

# ==============================================================================
# 
import freeton_utils
from   freeton_utils import *
import binascii
import unittest
import time
import sys
from   pathlib import Path
from   pprint import pprint
from   contract_Service           import Service
from   contract_Subscription      import Subscription
from   contract_SubscribeMultisig import SubscribeMultisig

SERVER_ADDRESS = "https://net.ton.dev"

# ==============================================================================
#
def getClient():
    return TonClient(config=ClientConfig(network=NetworkConfig(server_address=SERVER_ADDRESS)))

# ==============================================================================
# 
# Parse arguments and then clear them because UnitTest will @#$~!
for _, arg in enumerate(sys.argv[1:]):
    if arg == "--disable-giver":
        
        freeton_utils.USE_GIVER = False
        sys.argv.remove(arg)

    if arg == "--throw":
        
        freeton_utils.THROW = True
        sys.argv.remove(arg)

    if arg.startswith("http"):
        
        SERVER_ADDRESS = arg
        sys.argv.remove(arg)

    if arg.startswith("--msig-giver"):
        
        freeton_utils.MSIG_GIVER = arg[13:]
        sys.argv.remove(arg)

# ==============================================================================
# EXIT CODE FOR SINGLE-MESSAGE OPERATIONS
# we know we have only 1 internal message, that's why this wrapper has no filters
def _getAbiArray():
    return ["../bin/SetcodeMultisigWallet.abi.json", "../bin/Service.abi.json", "../bin/Subscription.abi.json", "../bin/SubscribeMultisig.abi.json"]

def _getExitCode(msgIdArray):
    abiArray     = _getAbiArray()
    msgArray     = unwrapMessages(getClient(), msgIdArray, abiArray)
    if msgArray != "":
        realExitCode = msgArray[0]["TX_DETAILS"]["compute"]["exit_code"]
    else:
        realExitCode = -1
    return realExitCode   

# ==============================================================================
# 
print("DEPLOYING CONTRACTS...")
# MSIGS
msigServices = SetcodeMultisig(tonClient=getClient())
giverGive(getClient(), msigServices.ADDRESS, TON * 10)
msigServices.deploy()

# SERVICES
service1 = Service(tonClient=getClient(), ownerAddress=msigServices.ADDRESS)
service2 = Service(tonClient=getClient(), ownerAddress=msigServices.ADDRESS)
service3 = Service(tonClient=getClient(), ownerAddress=msigServices.ADDRESS)
giverGive(getClient(), service1.ADDRESS, TON * 1)
giverGive(getClient(), service2.ADDRESS, TON * 1)
giverGive(getClient(), service3.ADDRESS, TON * 1)
service1.deploy()
service2.deploy()
service3.deploy()

service1.addSubscriptionPlan(msig=msigServices, planID=1, period=2,   periodPrice=DIME,    value=DIME, flags=1)
service1.addSubscriptionPlan(msig=msigServices, planID=2, period=20,  periodPrice=DIME*5,  value=DIME, flags=1)
service1.addSubscriptionPlan(msig=msigServices, planID=3, period=200, periodPrice=DIME*10, value=DIME, flags=1)
#print("SERVICE 1")
#pprint(service1.getSubscriptionPlans())

service2.addSubscriptionPlan(msig=msigServices, planID=10, period=5,   periodPrice=DIME,    value=DIME, flags=1)
service2.addSubscriptionPlan(msig=msigServices, planID=20, period=50,  periodPrice=DIME*15, value=DIME, flags=1)
service2.addSubscriptionPlan(msig=msigServices, planID=30, period=500, periodPrice=DIME*30, value=DIME, flags=1)
#print("SERVICE 2")
#pprint(service2.getSubscriptionPlans())

service3.addSubscriptionPlan(msig=msigServices, planID=100, period=90,   periodPrice=TON,    value=DIME, flags=1)
service3.addSubscriptionPlan(msig=msigServices, planID=200, period=2,    periodPrice=TON*6,  value=DIME, flags=1)
service3.addSubscriptionPlan(msig=msigServices, planID=300, period=9000, periodPrice=TON*10, value=DIME, flags=1)
#print("SERVICE 3")
#pprint(service3.getSubscriptionPlans())

# ==============================================================================
# 
class Test_01_CreateSubscription(unittest.TestCase):

    signer = generateSigner()
    ssig1  = SubscribeMultisig(tonClient=getClient(), signer=signer)
    giverGive(getClient(), ssig1.ADDRESS, TON * 1)
    ssig1.deploy()

    msig1  = SetcodeMultisig(tonClient=getClient(), signer=signer)
    msig1.ADDRESS = ssig1.ADDRESS

    def test_0(self):
        print("\n\n----------------------------------------------------------------------")
        print("Running:", self.__class__.__name__)

    def test_1(self):
        subInfo= service1.getSubscriptionPlans()["plans"][0]
        result = self.ssig1.createSubscription(serviceAddress=service1.ADDRESS, planID=int(subInfo["planID"], 16), period=int(subInfo["period"]), periodPrice=int(subInfo["periodPrice"]))
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
        #pprint(msgArray)

        confirmed = False
        for msg in msgArray:
            if msg["FUNCTION_NAME"] == "confirmSubscription" and msg["TARGET_ABI"].find("Subscription.abi.json") > 0:
                confirmed = msg["FUNCTION_PARAMS"]["confirmed"]
                break
        
        self.assertEqual(confirmed, True)

# ==============================================================================
# 
class Test_02_CreateSubscriptionWithWrongParams(unittest.TestCase):

    signer = generateSigner()
    ssig1  = SubscribeMultisig(tonClient=getClient(), signer=signer)
    giverGive(getClient(), ssig1.ADDRESS, TON * 1)
    result = ssig1.deploy()
    msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())

    msig1  = SetcodeMultisig(tonClient=getClient(), signer=signer)
    msig1.ADDRESS = ssig1.ADDRESS

    def test_0(self):
        print("\n\n----------------------------------------------------------------------")
        print("Running:", self.__class__.__name__)

    def test_1(self):
        subInfo= service1.getSubscriptionPlans()["plans"][0]
        result = self.ssig1.createSubscription(serviceAddress=service1.ADDRESS, planID=int(subInfo["planID"], 16)+666, period=int(subInfo["period"])+666, periodPrice=int(subInfo["periodPrice"])+666)
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
        #pprint(msgArray)

        confirmed = False
        for msg in msgArray:
            if msg["FUNCTION_NAME"] == "confirmSubscription" and msg["TARGET_ABI"].find("Subscription.abi.json") > 0:
                confirmed = msg["FUNCTION_PARAMS"]["confirmed"]
                break
        
        self.assertEqual(confirmed, False)

# ==============================================================================
# 
class Test_03_AutoProlongateSubscription(unittest.TestCase):

    signer = generateSigner()
    ssig1  = SubscribeMultisig(tonClient=getClient(), signer=signer)
    giverGive(getClient(), ssig1.ADDRESS, TON * 10)
    result = ssig1.deploy()
    msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
    
    msig1  = SetcodeMultisig(tonClient=getClient(), signer=signer)
    msig1.ADDRESS = ssig1.ADDRESS

    sub1 = Subscription(tonClient=getClient(), walletAddress=ssig1.ADDRESS, serviceAddress=service1.ADDRESS)

    def test_0(self):
        print("\n\n----------------------------------------------------------------------")
        print("Running:", self.__class__.__name__)

    def test_1(self):
        subInfo= service1.getSubscriptionPlans()["plans"][0]
        result = self.ssig1.createSubscription(serviceAddress=service1.ADDRESS, planID=int(subInfo["planID"], 16), period=int(subInfo["period"]), periodPrice=int(subInfo["periodPrice"]))
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())

        result = service1.subscriptionPaymentRequest(msig=msigServices, walletAddress=self.ssig1.ADDRESS, value=DIME, flags=1)
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
        #pprint(msgArray)

        payed = False
        for msg in msgArray:
            if msg["FUNCTION_NAME"] == "payForSubscription" and msg["TARGET_ABI"].find("Service.abi.json") > 0:
                payed = (msg["TX_DETAILS"]["aborted"] == False)
                break
        
        self.assertEqual(payed, True)

# ==============================================================================
# 
class Test_04_CancelSubscription(unittest.TestCase):

    signer = generateSigner()
    ssig1  = SubscribeMultisig(tonClient=getClient(), signer=signer)
    giverGive(getClient(), ssig1.ADDRESS, TON * 1)
    result = ssig1.deploy()
    msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
    
    msig1  = SetcodeMultisig(tonClient=getClient(), signer=signer)
    msig1.ADDRESS = ssig1.ADDRESS

    sub1 = Subscription(tonClient=getClient(), walletAddress=ssig1.ADDRESS, serviceAddress=service1.ADDRESS)

    def test_0(self):
        print("\n\n----------------------------------------------------------------------")
        print("Running:", self.__class__.__name__)

    def test_1(self):
        subInfo= service1.getSubscriptionPlans()["plans"][0]
        result = self.ssig1.createSubscription(serviceAddress=service1.ADDRESS, planID=int(subInfo["planID"], 16), period=int(subInfo["period"]), periodPrice=int(subInfo["periodPrice"]))
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())

        result = self.sub1.cancelSubscription(msig=self.msig1, value=DIME, flags=1)
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
        #pprint(msgArray)

        cancelled = False
        for msg in msgArray:
            if msg["FUNCTION_NAME"] == "cancelSubscription" and msg["TARGET_ABI"].find("Subscription.abi.json") > 0:
                cancelled = (msg["TX_DETAILS"]["aborted"] == False)
                break
        
        self.assertEqual(cancelled, True)
        

class Test_05_ProlongateSubcriptionWithNoMoney(unittest.TestCase):

    signer = generateSigner()
    ssig1  = SubscribeMultisig(tonClient=getClient(), signer=signer)
    giverGive(getClient(), ssig1.ADDRESS, TON * 10)
    result = ssig1.deploy()
    msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())
    
    msig1  = SetcodeMultisig(tonClient=getClient(), signer=signer)
    msig1.ADDRESS = ssig1.ADDRESS

    sub1 = Subscription(tonClient=getClient(), walletAddress=ssig1.ADDRESS, serviceAddress=service1.ADDRESS)

    def test_0(self):
        print("\n\n----------------------------------------------------------------------")
        print("Running:", self.__class__.__name__)

    def test_1(self):
        subInfo= service3.getSubscriptionPlans()["plans"][1]
        result = self.ssig1.createSubscription(serviceAddress=service3.ADDRESS, planID=int(subInfo["planID"], 16), period=int(subInfo["period"]), periodPrice=int(subInfo["periodPrice"]))
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())

        result = service3.subscriptionPaymentRequest(msig=msigServices, walletAddress=self.ssig1.ADDRESS, value=DIME, flags=1)
        msgArray = unwrapMessages(getClient(), result[0].transaction["out_msgs"], _getAbiArray())

        payed = False
        for msg in msgArray:
            if msg["FUNCTION_NAME"] == "subscriptionPaymentRequested" and msg["TARGET_ABI"].find("SubscribeMultisig.abi.json") > 0:
                payed = (msg["TX_DETAILS"]["aborted"] == False)
                break
        
        self.assertEqual(payed, False)


# ==============================================================================
# 
unittest.main()
