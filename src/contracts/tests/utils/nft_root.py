
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
DEFAULT_MESSAGE_VALUE = 0.5 * ts4.GRAM
DEFAULT_AUTHOR_ROYALTY_PERCENT = 25
DEFAULT_AGENT_ROYALTY_PERCENT = 0

ts4.init('test_build', verbose = False)

code_index = ts4.load_code_cell('Index.tvc')
code_data = ts4.load_code_cell('Data.tvc')


def create_nft_root(
    commission_agent: BaseContract,
    royalty_agent: BaseContract,
    commission: int = DEFAULT_COMMISSION,
    royalty_agent_percent: int = DEFAULT_AGENT_ROYALTY_PERCENT,
    init_balance: int = DEFAULT_NFT_ROOT_BALANCE):

    (private_key, public_key) = ts4.make_keypair()

    nft_root = BaseContract(
        'NftRoot',
        ctor_params = {
            'codeIndex': code_index,
            'codeData': code_data,
            'addrCommissionAgent': commission_agent.address,
            'mintingCommission': commission,
            'nftTypes': NFT_TYPES, 
            'limit': TYPES_LIMIT,
            'name': Bytes(str2bytes('some_name')),
            'icon': Bytes(str2bytes('some_image')),
            'addrNftRootRoyaltyAgent': royalty_agent.address,
            'nftRootRoyaltyPercent': royalty_agent_percent,
        },
        pubkey = public_key, 
        private_key = private_key,
        balance = init_balance,
    )
    return nft_root


def mint_nft(
    nft_root: BaseContract,
    wallet: BaseContract,
    message_value: int,
    royalty_author_percent: int = DEFAULT_AUTHOR_ROYALTY_PERCENT,
    expected_err: int = 0):

    payload_mint_nft = ts4.encode_message_body(
        'NftRoot',
        'mintNft',
        params = {
            'name': Bytes(str2bytes('some_name')),
            'url': Bytes(str2bytes('some_url')),
            'editionNumber': 1,
            'editionAmount': 1,
            'managersList': [],
            'royalty': royalty_author_percent,

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
            'value': message_value,
            'bounce': True,
            'flags': 3,
            'payload': payload_mint_nft,
        },
    )
    ts4.dispatch_one_message(expected_err)
    ts4.dispatch_messages()


def get_nft_addr(nft_root: BaseContract, nft_id: int):
    addr_nft = nft_root.call_getter(
        'resolveData',
        params = {
            'addrRoot': nft_root.address,
            'id': nft_id,
        },
    )
    return addr_nft
