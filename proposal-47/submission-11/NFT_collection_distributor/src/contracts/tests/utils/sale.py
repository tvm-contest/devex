
import tonos_ts4.ts4 as ts4
from tonos_ts4.BaseContract import BaseContract

GRAM = ts4.GRAM

def restore_sale_by_addr(sale_address: ts4.Address):
    sale = BaseContract(
        'DirectSale',
        ctor_params = {},
        address = sale_address,
    )
    return sale

def start_sale(
    sale: BaseContract,
    wallet: BaseContract,
    price: int,
    is_limited: bool = False,
    duration: int = 0,
    attached_value: int = 5 * GRAM):
    payload_start_sale = ts4.encode_message_body(
        'DirectSale',
        'start',
        params = {
            'nftPrice': price,
            'isDurationLimited': is_limited,
            'saleDuration': duration
        }
    )
    wallet.call_method_signed(
        'sendTransaction',
        params = {
            'dest': sale.address,
            'value': attached_value,
            'bounce': True,
            'flags': 3,
            'payload': payload_start_sale,
        },
    )
    ts4.dispatch_messages()


def buy_from_sale(sale: BaseContract, wallet: BaseContract, message_value: int):
    payload_buy = ts4.encode_message_body(
        'DirectSale',
        'buy',
        params = {}
    )
    wallet.call_method_signed(
        'sendTransaction',
        params = {
            'dest': sale.address,
            'value': message_value,
            'bounce': True,
            'flags': 3,
            'payload': payload_buy,
        },
    )
    ts4.dispatch_messages()


def cancel_sale(sale: BaseContract, wallet: BaseContract, message_value: int):
    payload_cancel = ts4.encode_message_body(
        'DirectSale',
        'cancel',
        params = {}
    )
    wallet.call_method_signed(
        'sendTransaction',
        params = {
            'dest': sale.address,
            'value': message_value,
            'bounce': True,
            'flags': 3,
            'payload': payload_cancel,
        },
    )
    ts4.dispatch_messages()


def get_nft_sale_price(sale: BaseContract):
    return sale.call_getter_raw('getNftPrice', {})

def get_sale_info(sale: BaseContract):
    return sale.call_getter_raw('getInfo', {})
