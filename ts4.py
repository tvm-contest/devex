import tonos_ts4.ts4 as ts4

eq = ts4.eq
ts4.init('c:/Users/renat/Subscriptions/contracts', verbose = False)
# Load a contract from .tvc-file and deploy it into a virtual blockchain.
# Constructor is called automatically.
# After deployment, "logstr: Constructor" will appear in the output to facilitate the debugging process.
subs = ts4.BaseContract('c:/Users/renat/Subscriptions/contracts/Subscription', ctor_params = {'wallet': '0:109474cf57d7551a8e491956e48e49f4984b32e5bfe19b57b4cc56c1234168c0'})
print(subs.addr)
answer = subs.call_getter('mywallet')
print(ts4.cyan(answer))