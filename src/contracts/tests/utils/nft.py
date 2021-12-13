
import tonos_ts4.ts4 as ts4
from tonos_ts4.BaseContract import BaseContract

eq = ts4.eq

def restore_nft_by_addr(nft_address: ts4.Address):
    nft_root = BaseContract(
        'Data',
        ctor_params = {},
        address = nft_address,
    )
    return nft_root


def transfer_nft(wallet_owner: BaseContract, wallet_receiver: BaseContract, nft: BaseContract, value: int):
    payload_transfer_nft = ts4.encode_message_body(
        'Data',
        'transferOwnership',
        params = { 'addrTo': wallet_receiver.address }
    )
    wallet_owner.call_method_signed(
        'sendTransaction',
        params = {
            'dest': nft.address,
            'value': value,
            'bounce': True,
            'flags': 3,
            'payload': payload_transfer_nft,
        },
    )
    ts4.dispatch_messages()


def lend_ownership(wallet_owner: BaseContract, wallet_trusted: BaseContract, nft: BaseContract, value: int):
    payload_lend_ownership = ts4.encode_message_body(
        'Data',
        'lendOwnership',
        params = { '_addr': wallet_trusted.address }
    )
    wallet_owner.call_method_signed(
        'sendTransaction',
        params = {
            'dest': nft.address,
            'value': value,
            'bounce': True,
            'flags': 3,
            'payload': payload_lend_ownership,
        },
    )
    ts4.dispatch_messages()


def return_ownership(wallet_trusted: BaseContract, nft: BaseContract, value: int):
    payload_return_ownership = ts4.encode_message_body(
        'Data',
        'returnOwnership',
        params = {}
    )
    wallet_trusted.call_method_signed(
        'sendTransaction',
        params = {
            'dest': nft.address,
            'value': value,
            'bounce': True,
            'flags': 3,
            'payload': payload_return_ownership,
        },
    )
    ts4.dispatch_messages()


def get_nft_info(nft: BaseContract):
    return nft.call_getter_raw('getInfo', {})


def get_trusted_addr(nft: BaseContract):
    return nft.call_getter('getAllowance', {})