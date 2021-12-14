
import tonos_ts4.ts4 as ts4
from tonos_ts4.BaseContract import BaseContract
from tonos_ts4.address import Address

GRAM = ts4.GRAM

DEFAULT_SALE_ROOT_BALANCE = 100 * GRAM
DEFAULT_SALE_ROOT_ROYALTY = 25
DEFAULT_MESSAGE_VALUE = GRAM

ts4.init('test_build', verbose = False)

code_sale = ts4.load_code_cell('DirectSale.tvc')

def create_sale_root(
    royalty_agent: BaseContract,
    royalty: int = DEFAULT_SALE_ROOT_ROYALTY,
    init_balance: int = DEFAULT_SALE_ROOT_BALANCE):

    (private_key, public_key) = ts4.make_keypair()

    sale_root = BaseContract(
        'DirectSaleRoot',
        ctor_params = {
            'codeSale': code_sale,
            'addrRoyaltyAgent': royalty_agent.address,
            'royaltyPercent': royalty,
        },
        pubkey = public_key, 
        private_key = private_key,
        balance = init_balance,
    )
    return sale_root


def create_sale(
    sale_root: BaseContract,
    wallet: BaseContract,
    nft: BaseContract,
    attached_value: int = 5 * GRAM):

    payload_create_sale = ts4.encode_message_body(
        'DirectSaleRoot',
        'createSale',
        params = {
            'addrNft': nft.address,
        }
    )
    wallet.call_method_signed(
        'sendTransaction',
        params = {
            'dest': sale_root.address,
            'value': attached_value,
            'bounce': True,
            'flags': 3,
            'payload': payload_create_sale,
        },
    )
    ts4.dispatch_messages()


def get_sale_addr(sale_root: BaseContract, sale_owner: BaseContract, nft: BaseContract):
    addr_sale = sale_root.call_getter(
        'getSaleAddress',
        params = {
            'addrOwner': sale_owner.address,
            'addrNft': nft.address,
        },
    )
    return addr_sale