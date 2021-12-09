import tonos_ts4.ts4 as ts4, json

eq = ts4.eq
bt = 1000000

ts4.set_verbose(True)
ts4.set_tests_path('../build/')
ts4.G_WARN_ON_UNEXPECTED_ANSWERS = True
ts4.core.trace_on()
# ts4.G_STOP_AT_CRASH = False

print("==================== Initialization ====================")

plat = ts4.core.load_code_cell('../build/DensPlatform.tvc')
cert = ts4.core.load_code_cell('../build/DensCertificate.tvc')
auct = ts4.core.load_code_cell('../build/DensAuction.tvc')

ts4.register_abi('DensPlatform')
ts4.register_abi('DensCertificate')
ts4.register_abi('DensAuction')

class Root(ts4.BaseContract):
    def __init__(self):
        self.create_keypair()
        super(Root, self).__init__('DensRoot', {}, pubkey=self.public_key_, private_key=self.private_key_,
                                   nickname='Root', override_address=ts4.Address('0:' + (64 * '7')))

ts4.core.set_now(bt)

print("\n==================== Create root ====================")

root = Root()

print("\n==================== Install code ====================")

root.call_method_signed('installPlatform', {'code': plat})
root.call_method_signed('installCertificate', {'code': cert})
root.call_method_signed('installAuction', {'code': auct})

print("\n==================== Resolve 'hel' ====================")

caddr = root.call_getter('resolve', {'name': '68656c'})

# root.call_method('deployCertificate', {'name': '68656c6c6f'})
# ts4.dispatch_messages()

print("\n==================== Create tester ====================")

test = ts4.BaseContract('DensTest', {'_root': root.address()}, nickname='Test', override_address=ts4.Address('0:' + (64 * '1')))
test2 = ts4.BaseContract('DensTest', {'_root': root.address()}, nickname='Test2', override_address=ts4.Address('0:' + (64 * '2')))
test3 = ts4.BaseContract('DensTest', {'_root': root.address()}, nickname='Test3', override_address=ts4.Address('0:' + (64 * '3')))
test4 = ts4.BaseContract('DensTest', {'_root': root.address()}, nickname='Test4', override_address=ts4.Address('0:' + (64 * '4')))

print("\n==================== Perform directlyDeploy 'test' on root ====================")
root.call_method_signed('directlyDeploy', {"name":"74657374","_owner":"0:16727aa2069d16b632d596ea411647c32a176cb3bc970c72080d9a0647e9eebd","expiry":1648327562})
ts4.dispatch_messages()

print("\n==================== Perform regName 'hel' on root ====================")

auct = root.call_getter('auction', {'name': '68656c'})
print('auct:', auct)

nonce = '0x123456789'

test.call_method('regName', {'req': {'name': '68656c', 'duration': 3, 'hash': '0x00'},
                             'amount': 5 * ts4.GRAM, 'nonce': nonce})
ts4.dispatch_messages()

au = ts4.BaseContract('DensAuction', None, address=auct, nickname='HelAuct')
print(au.call_getter('hashes'))

print("\n==================== Perform bid 'hel' on auct ====================")
test.call_method('bid', {'dest': auct, 'amount': 10 * ts4.GRAM, 'nonce': nonce })
ts4.dispatch_messages()

print(au.call_getter('hashes'))

print("\n==================== Perform regName 'hel' on root ====================")
test2.call_method('regName', {'req': {'name': '68656c', 'duration': 3, 'hash': '0x00'},
                              'amount': 20 * ts4.GRAM, 'nonce': nonce})
ts4.dispatch_messages()

print(au.call_getter('hashes'))

print("\n==================== Perform another 'hel' on auct ====================")
test3.call_method('bid', {'dest': auct, 'amount': 30 * ts4.GRAM, 'nonce': nonce})
ts4.dispatch_messages()

print(au.call_getter('hashes'))

print("\n==================== Perform another 'hel' on auct ====================")
test4.call_method('bid', {'dest': auct, 'amount': 50 * ts4.GRAM, 'nonce': nonce})
ts4.dispatch_messages()

print(au.call_getter('hashes'))


print("\n==================== Verify getters auct ====================")
endbid = au.call_getter('endBid')
endrev = au.call_getter('endRev')
print(au.call_getter('start'), endbid, endrev, au.call_getter('expiry'))

print("\n==================== Auction reveal ====================")
print(au.call_getter('reveals'))

ts4.core.set_now(endbid)

test.call_method('reveal', {'dest': auct, 'amount': 10 * ts4.GRAM, 'nonce': nonce })
ts4.dispatch_messages()

print(au.call_getter('reveals'))

test2.call_method('reveal', {'dest': auct, 'amount': 20 * ts4.GRAM, 'nonce': nonce })
ts4.dispatch_messages()

print(au.call_getter('reveals'))

test4.call_method('reveal', {'dest': auct, 'amount': 50 * ts4.GRAM, 'nonce': nonce })
ts4.dispatch_messages()

print(au.call_getter('reveals'))

print("\n==================== Final stage ====================")
ts4.core.set_now(endrev)

test4.call_method('finalize', {'dest': auct})
ts4.dispatch_messages()

print("\n==================== Check 'hel' cert ====================")

cc = ts4.BaseContract('DensCertificate', None, address=caddr, nickname='HelloCert')
print(cc.call_getter('root'))
print(cc.call_getter('owner'))

print("\n==================== Test 'hel' setValue ====================")

test4.call_method('setValue', {'dest': caddr, 'value': caddr})
ts4.dispatch_messages()

print(cc.call_getter('value'))

print("\n==================== Test transfer ownership ====================")

test4.call_method('transferOwner', {'dest': caddr, 'new_owner': test.address()})
ts4.dispatch_messages()

print(cc.call_getter('owner'))
print(cc.call_getter('pending_owner'))

test.call_method('acceptOwner', {'dest': caddr})
ts4.dispatch_messages()

print(cc.call_getter('owner'))
print(cc.call_getter('pending_owner'))

print("\n==================== Test subcertificate ====================")

test.call_method('requestSubCertificate', {'dest': caddr, 'name': '737562', 'expiry': 0})
ts4.dispatch_messages()

suba = root.call_getter('resolveSub', {'name': '737562', 'cert': caddr})
print(suba)

sc = ts4.BaseContract('DensCertificate', None, address=suba, nickname='SubCert')
print(sc.call_getter('root'))
print(sc.call_getter('owner'))
print(sc.call_getter('parent'))

test.call_method('setValue', {'dest': suba, 'value': test3.address()})
ts4.dispatch_messages()

print(sc.call_getter('value'))

test.call_method('transferOwner', {'dest': caddr, 'new_owner': test2.address()})
ts4.dispatch_messages()

test2.call_method('acceptOwner', {'dest': caddr})
ts4.dispatch_messages()

print(cc.call_getter('owner'))
print(sc.call_getter('owner'))

test2.call_method('syncSubCertificate', {'dest': caddr, 'name': '737562', 'expiry': 0})
ts4.dispatch_messages()

print(cc.call_getter('owner'))
print(sc.call_getter('owner'))
