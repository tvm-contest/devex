
import tonos_ts4.ts4 as ts4
from tonos_ts4.BaseContract import BaseContract
from tonos_ts4.address import Address, Bytes, str2bytes

eq = ts4.eq

DEFAULT_NFT_ROOT_BALANCE = 100 * ts4.GRAM
NFT_TYPES = [Bytes(str2bytes('common')),
             Bytes(str2bytes('rare')),
             Bytes(str2bytes('legendary'))]
TYPES_LIMIT = [100, 50, 5]
DEFAULT_COMMISSION = 1 * ts4.GRAM
DEFAULT_AUTHOR_ROYALTY = 25

ts4.init('test_build', verbose = False)

code_index = ts4.load_code_cell('Index.tvc')
code_data = ts4.load_code_cell('Data.tvc')

def create_nft_root(
    addrAgent: Address,
    commission: int = DEFAULT_COMMISSION,
    init_balance: int = DEFAULT_NFT_ROOT_BALANCE):

    (private_key, public_key) = ts4.make_keypair()

    nft_root = BaseContract(
        'NftRoot',
        ctor_params = {
            'codeIndex': code_index,
            'codeData': code_data,
            'addrCommissionAgent': addrAgent,
            'mintingCommission': commission,
            'nftTypes': NFT_TYPES, 
            'limit': TYPES_LIMIT,
            'name': Bytes(str2bytes('some_name')),
            'icon': Bytes(str2bytes('some_image')),
        },
        pubkey = public_key, 
        private_key = private_key,
        balance = init_balance,
    )
    return nft_root

def mint_nft(
    wallet: BaseContract,
    nft_root: BaseContract,
    value: int,
    royalty: int = DEFAULT_AUTHOR_ROYALTY):

    payload_mint_nft = ts4.encode_message_body(
        'NftRoot',
        'mintNft',
        params = {
            'name': Bytes(str2bytes('some_name')),
            'url': Bytes(str2bytes('some_url')),
            'editionNumber': 1,
            'editionAmount': 1,
            'managersList': [],
            'royalty': royalty,

            'nftType': NFT_TYPES[0],
            'additionalEnumParameter': 1,
            'additionalStrParameter': Bytes(str2bytes('some_str')),
            'additionalIntParameter': 1,
            'additionalBoolParameter': True,
        }
    )
    wallet.call_method_signed(
        'sendTransaction',
        params = {
            'dest': nft_root.address,
            'value': value,
            'bounce': True,
            'flags': 3,
            'payload': payload_mint_nft,
        },
    )
    ts4.dispatch_messages()


def get_nft_addr(nft_root: BaseContract, nft_id: int):
    nft_addr = nft_root.call_getter(
        'resolveData',
        params = {
            'addrRoot': nft_root.address,
            'id': nft_id,
        },
    )
    return nft_addr