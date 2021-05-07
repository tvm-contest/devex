import tonos_ts4.ts4 as ts4, json

eq = ts4.eq
bt = 1000000

ts4.set_verbose(True)
ts4.set_tests_path('../build/')
ts4.G_WARN_ON_UNEXPECTED_ANSWERS = True

plat = ts4.core.load_code_cell('../build/DensPlatform.tvc')
cert = ts4.core.load_code_cell('../build/DensCertificate.tvc')
auct = ts4.core.load_code_cell('../build/DensAuction.tvc')
bid  = ts4.core.load_code_cell('../build/DensBid.tvc')
rcod = ts4.core.load_code_cell('../build/DensRoot.tvc')

ts4.register_abi('DensPlatform')
ts4.register_abi('DensCertificate')
ts4.register_abi('DensAuction')
ts4.register_abi('DensBid')

class Root(ts4.BaseContract):
    def __init__(self):
        self.create_keypair()
        super(Root, self).__init__('DensRoot', {}, pubkey=self.public_key_, private_key=self.private_key_,
                                   nickname='Root', override_address=ts4.Address('0:' + (64 * 'a')))

def h(s: str): return s.encode('ASCII').hex()
def seg(s: str): print('#\n# {}\n#'.format(s))
def dm(): ts4.dispatch_messages()
def gr(g: int = 1): return g * ts4.GRAM
def b(acct): return acct.balance() / gr() if acct.balance() is not None else '-'
def cg(acct, meth): return acct.call_getter(meth)

ts4.core.set_now(bt)
nonce = '0x123456789'


seg('Root initialization')
root = Root()


seg('Code installation')
root.call_method_signed('installPlatform', {'code': plat})
root.call_method_signed('installCertificate', {'code': cert})
root.call_method_signed('installAuction', {'code': auct})
root.call_method_signed('installBid', {'code': bid})


seg('Upgrade (setCode)')
root.call_method_signed('upgrade', {'code': rcod})


seg('Create test accounts')
tac, tad = {}, {}
for i in range(1, 9+1):
    tac[i] = ts4.BaseContract('DensTest', {'_root': root.address()}, nickname='Test{}'.format(i),
                           override_address=ts4.Address('0:' + (64 * str(i))))
    tad[i] = tac[i].addr()


seg('Directly deploy some domains')
root.call_method_signed('directlyDeploy', {'name': h('test1'), '_owner': tad[1], 'expiry': bt + 1000})
root.call_method_signed('directlyDeploy', {'name': h('test2'), '_owner': tad[2], 'expiry': bt + 20000})
root.call_method_signed('directlyDeploy', {'name': h('test3'), '_owner': tad[3], 'expiry': bt + 300000})


seg('Try to resolve address')
caddr = root.call_getter('resolve', {'name': h('test2')})
print('test2 -> {}'.format(caddr))


seg('Try regName on hello')
tac[1].call_method('regName', {'req': {'name': h('hello'), 'duration': 3, 'hash': '0x00'}, 'amount': gr(5), 'nonce': nonce}); dm()
tac[2].call_method('regName', {'req': {'name': h('hello'), 'duration': 3, 'hash': '0x00'}, 'amount': gr(7), 'nonce': nonce}); dm()
tac[3].call_method('regName', {'req': {'name': h('hello'), 'duration': 3, 'hash': '0x00'}, 'amount': gr(3), 'nonce': nonce}); dm()


seg('Check out auction')
aaddr = root.call_getter('resolveFull', {'_answer_id': 0, 'fullname': h('hello'), 'ptype': 2})
auct = ts4.BaseContract('DensAuction', None, address=aaddr, nickname='HelloAuct')


seg('Check out deep resolving')
a1 = root.call_getter('resolveRPC', {'_answer_id': 0, 'name': h('first'), 'cert': root.addr(), 'ptype': 1})
a2 = root.call_getter('resolveRPC', {'_answer_id': 0, 'name': h('second'), 'cert': a1, 'ptype': 1})
a3 = root.call_getter('resolveRPC', {'_answer_id': 0, 'name': h('third'), 'cert': a2, 'ptype': 1})
print('first -> second -> third: {}'.format(a3))

aa = root.call_getter('resolveFull', {'_answer_id': 0, 'fullname': h('first/second/third'), 'ptype': 1})
print('first/second/third: {}'.format(aa))


seg('Inspect hello auction')
endbid = auct.call_getter('endBid')
endrev = auct.call_getter('endRev')
print(auct.call_getter('start'), endbid, endrev, auct.call_getter('expiry'))


seg('Find bids')
b1a = auct.call_getter('findBid', {'_answer_id': 0, 'bidder': tad[1]})
b2a = auct.call_getter('findBid', {'_answer_id': 0, 'bidder': tad[2]})
b3a = auct.call_getter('findBid', {'_answer_id': 0, 'bidder': tad[3]})
b1 = ts4.BaseContract('DensBid', None, address=b1a, nickname='HelloBid1')
b2 = ts4.BaseContract('DensBid', None, address=b2a, nickname='HelloBid2')
b3 = ts4.BaseContract('DensBid', None, address=b3a, nickname='HelloBid3')
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, T1: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(tac[1])))


seg('Update hash and direct bid auct')
tac[3].call_method('bid2', {'dest': b3a, 'amount': gr(2), 'nonce': nonce}); dm()
tac[4].call_method('bid', {'dest': aaddr, 'amount': gr(6), 'nonce': nonce}); dm()
b4a = auct.call_getter('findBid', {'_answer_id': 0, 'bidder': tad[4]})
b4 = ts4.BaseContract('DensBid', None, address=b4a, nickname='HelloBid4')


seg('Fast forward, try reveals')
ts4.core.set_now(endbid)
tac[1].call_method('reveal', {'dest': b1a, 'amount': gr(5), 'nonce': nonce}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
print('First: {}, {}; Second: {}, {}'.format(cg(auct, 'top_bid'), cg(auct, 'top_bid_amt') / gr(), cg(auct, 'sec_bid'), cg(auct, 'sec_bid_amt') / gr()))
tac[2].call_method('reveal', {'dest': b2a, 'amount': gr(7), 'nonce': nonce}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
print('First: {}, {}; Second: {}, {}'.format(cg(auct, 'top_bid'), cg(auct, 'top_bid_amt') / gr(), cg(auct, 'sec_bid'), cg(auct, 'sec_bid_amt') / gr()))
tac[3].call_method('reveal', {'dest': b3a, 'amount': gr(2), 'nonce': nonce}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
print('First: {}, {}; Second: {}, {}'.format(cg(auct, 'top_bid'), cg(auct, 'top_bid_amt') / gr(), cg(auct, 'sec_bid'), cg(auct, 'sec_bid_amt') / gr()))
tac[4].call_method('reveal', {'dest': b4a, 'amount': gr(6), 'nonce': nonce}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
print('First: {}, {}; Second: {}, {}'.format(cg(auct, 'top_bid'), cg(auct, 'top_bid_amt') / gr(), cg(auct, 'sec_bid'), cg(auct, 'sec_bid_amt') / gr()))


seg('Fast forward, finalize auction')
ts4.core.set_now(endrev)
tac[2].call_method('finalize', {'dest': aaddr}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))


seg('Withdraw stuff')
tac[1].call_method('withdraw', {'dest': b1a}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
tac[2].call_method('withdraw', {'dest': b2a}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
tac[3].call_method('withdraw', {'dest': b3a}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))
tac[4].call_method('withdraw', {'dest': b4a}); dm()
print('Balances: R: {}, A: {}, 1: {}, 2: {}, 3: {}, 4: {}, T1: {}, T2: {}, T3: {}, T4: {}'.format(b(root), b(auct), b(b1), b(b2), b(b3), b(b4), b(tac[1]), b(tac[2]), b(tac[3]), b(tac[4])))


seg('Certificate')
co = tac[2]
ca = root.call_getter('resolveFull', {'_answer_id': 0, 'fullname': h('hello'), 'ptype': 1})
cc = ts4.BaseContract('DensCertificate', None, address=ca, nickname='HelloCert')
co.call_method('setValue', {'dest': ca, 'value': tad[1]}); dm()
co.call_method('setTarget', {'dest': ca, 'typ': 3, 'value': tad[3]}); dm()

print(cc.call_getter('getTarget', {'_answer_id': 0, 'rec_type': 0}))
print(cc.call_getter('getTarget', {'_answer_id': 0, 'rec_type': 3}))


seg('Reserved names')
root.call_method_signed('reserveName', {'name': h('admin'), 'until': 1})
tac[1].call_method('regName', {'req': {'name': h('admin'), 'duration': 3, 'hash': '0x00'}, 'amount': gr(999), 'nonce': nonce}); dm()


seg('Auction bans')
root.call_method_signed('setNewAuctionsBan', {'until': endrev + 10})
tac[1].call_method('regName', {'req': {'name': h('okay'), 'duration': 3, 'hash': '0x00'}, 'amount': gr(12), 'nonce': nonce}); dm()
ts4.core.set_now(endrev + 11)
tac[1].call_method('regName', {'req': {'name': h('okay'), 'duration': 3, 'hash': '0x00'}, 'amount': gr(12), 'nonce': nonce}); dm()


seg('Upgrade (setCode)')
root.call_method_signed('upgrade', {'code': rcod})


