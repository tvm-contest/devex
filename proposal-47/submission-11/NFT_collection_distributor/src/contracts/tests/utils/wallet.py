
import tonos_ts4.ts4 as ts4

eq = ts4.eq

DEFAULT_WALLET_BALANCE = 100 * ts4.GRAM

def create_wallet(init_balance: int = DEFAULT_WALLET_BALANCE):
    (private_key, public_key) = ts4.make_keypair()

    wallet = ts4.BaseContract(
        'SafeMultisigWallet',
        ctor_params = {
            'owners': [public_key],
            'reqConfirms': 0,
        },
        pubkey = public_key, 
        private_key = private_key,
        balance = init_balance,
    )
    return wallet