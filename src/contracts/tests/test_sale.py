
import unittest
from operator import itemgetter
import tonos_ts4.ts4 as ts4

from utils.wallet import DEFAULT_WALLET_BALANCE, create_wallet
from utils.nft_root import create_nft_root, mint_nft, get_nft_addr
from utils.nft import restore_nft_by_addr, transfer_nft, get_nft_info, lend_ownership
from utils.sale_root import create_sale_root, create_sale, get_sale_addr
from utils.sale import restore_sale_by_addr, start_sale, buy_from_sale

from random import randint
unittest.TestLoader.sortTestMethodsUsing = lambda _, x, y: randint(-1, 1)

ts4.init('test_build', verbose = False)

GRAM = ts4.GRAM

ZERO_ADDRES = ts4.Address.zero_addr(0)
MINT_PRICE = 20 * GRAM
TRANSFER_PRICE = 2 * GRAM
LEND_PRICE = 2 * GRAM
RETURN_PRICE = 2 * GRAM
NFT_PRICE = 20 * GRAM
MIN_FOR_MESSAGE = 100_000_000
MIN_FOR_TRANSFER_OWNERSHIP = 1_100_000_000
NFT_SALE_PRICE = 15 * GRAM
DEFAULT_MESSAGE_VALUE = 500_000_000

def prepare_sale(): 
    wallet_author = create_wallet()
    wallet_seller = create_wallet()
    wallet_buyer = create_wallet()
    wallet_commission_agent = create_wallet()
    wallet_royalty_agent = create_wallet()

    nft_root = create_nft_root(wallet_commission_agent)
    mint_nft(nft_root, wallet_author, MINT_PRICE, 20)
    nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))

    transfer_nft(wallet_author, wallet_seller, nft, TRANSFER_PRICE)

    sale_root = create_sale_root(wallet_royalty_agent, 10)
    lend_ownership(wallet_seller, sale_root, nft, LEND_PRICE)
    create_sale(sale_root, wallet_seller, nft)
    sale = restore_sale_by_addr(get_sale_addr(sale_root, wallet_seller, nft))
    start_sale(sale, wallet_seller, NFT_SALE_PRICE)

    prepared_info = {
        'author': wallet_author,
        'seller': wallet_seller,
        'buyer': wallet_buyer,
        'nft_root': nft_root,
        'nft': nft,
        'sale': sale,
        'sale_root': sale_root,
        'royalty_agent': wallet_royalty_agent,
        'commission_agent': wallet_commission_agent,
        'author_balance_before': wallet_author.balance,
        'royalty_agent_balance_before': wallet_royalty_agent.balance
    }
    return prepared_info


class TestSale(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        ts4.reset_all()

    def tearDown(self):
        ts4.reset_all()

    def test_buy(self):
        prepared_info = prepare_sale()
        wallet_seller, wallet_buyer, nft, sale = \
            itemgetter('seller', 'buyer', 'nft', 'sale')(prepared_info)

        buy_from_sale(sale, wallet_buyer, NFT_SALE_PRICE + MIN_FOR_TRANSFER_OWNERSHIP + 3 * MIN_FOR_MESSAGE)

        royalty_agent_revenue = prepared_info['royalty_agent'].balance - prepared_info['royalty_agent_balance_before']
        author_revenue = prepared_info['author'].balance - prepared_info['author_balance_before'] - 2 * MIN_FOR_MESSAGE

        nft_info = get_nft_info(nft)

        self.assertEqual(royalty_agent_revenue, NFT_SALE_PRICE*0.1)
        self.assertEqual(royalty_agent_revenue, NFT_SALE_PRICE*0.1)
        self.assertEqual(wallet_seller.balance - DEFAULT_WALLET_BALANCE + royalty_agent_revenue + author_revenue, NFT_SALE_PRICE)
        self.assertEqual(nft_info['addrOwner'], wallet_buyer.address.str())
        
        self.assertIsNone(sale.balance)

if __name__ == '__main__':
    unittest.main()