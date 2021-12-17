
import unittest
from operator import itemgetter
import tonos_ts4.ts4 as ts4

from utils.wallet import create_wallet, DEFAULT_WALLET_BALANCE
from utils.nft_root import create_nft_root, mint_nft, get_nft_addr, DEFAULT_NFT_ROOT_BALANCE
from utils.nft import restore_nft_by_addr, get_nft_info

from random import randint
unittest.TestLoader.sortTestMethodsUsing = lambda _, x, y: randint(-1, 1)

ts4.init('test_build', verbose = False)

ZERO_ADDRES = ts4.Address.zero_addr(0)
MINT_COMMISSION = 5 * ts4.GRAM
MIN_FOR_MINTING = 1_700_000_000
MIN_FOR_DATA_DEPLOY = 1_500_000_000

# error codes
NOT_ENOUGH_VALUE_TO_MINT = 107

def prepare_for_minting():
    wallet_minter = create_wallet()
    wallet_commission_agent = create_wallet()
    nft_root = create_nft_root(wallet_commission_agent, MINT_COMMISSION)

    prepared_info = {
        'minter': wallet_minter,
        'root': nft_root,
        'commission_agent': wallet_commission_agent,
    }
    return prepared_info


class TestNftMinting(unittest.TestCase):   

    def tearDown(self):
        ts4.reset_all()

    #  checking the NFT minting correctness
    def test_wallet_can_mint_nft(self):
        wallet_minter, nft_root = itemgetter('minter', 'root')(prepare_for_minting())

        MINT_PRICE = MINT_COMMISSION + MIN_FOR_MINTING
        mint_nft(nft_root, wallet_minter, MINT_COMMISSION + MINT_PRICE)
        nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))

        nft_info = get_nft_info(nft)
        self.assertEqual(nft_info['addrOwner'], wallet_minter.address.str())

    #  checking the withdraw from minter's wallet with commission
    def test_minter_wallet_withdraw_with_commission(self):
        wallet_minter, wallet_commission_agent, nft_root = \
            itemgetter('minter', 'commission_agent', 'root')(prepare_for_minting())

        MINT_PRICE = 2*MINT_COMMISSION + MIN_FOR_MINTING
        mint_nft(nft_root, wallet_minter, MINT_PRICE)
        nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))
        nft_info = get_nft_info(nft)

        self.assertEqual(nft_info['addrOwner'], wallet_minter.address.str())
        self.assertEqual(wallet_minter.balance, DEFAULT_WALLET_BALANCE - MIN_FOR_DATA_DEPLOY - MINT_COMMISSION)
        self.assertEqual(wallet_commission_agent.balance, MINT_COMMISSION + DEFAULT_WALLET_BALANCE)
        self.assertEqual(nft_root.balance, DEFAULT_NFT_ROOT_BALANCE)

    # checking the withdraw from commission agent's wallet without commission
    def test_agent_wallet_withdraw_with_commission(self):
        wallet_commission_agent, nft_root = itemgetter('commission_agent', 'root')(prepare_for_minting())

        MINT_PRICE = 2*MINT_COMMISSION + MIN_FOR_MINTING
        mint_nft(nft_root, wallet_commission_agent, MINT_PRICE)
        nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))
        nft_info = get_nft_info(nft)

        self.assertEqual(nft_info['addrOwner'], wallet_commission_agent.address.str())
        self.assertEqual(wallet_commission_agent.balance, DEFAULT_WALLET_BALANCE - MIN_FOR_DATA_DEPLOY)
        self.assertEqual(nft_root.balance, DEFAULT_NFT_ROOT_BALANCE)

    # checking the withdraw from nft root balance if commission agent sent not enought
    def test_agent_can_mint_using_nft_root_balance(self):
        wallet_commission_agent, nft_root = itemgetter('commission_agent', 'root')(prepare_for_minting())

        MINT_PRICE = MIN_FOR_MINTING - 1
        mint_nft(nft_root, wallet_commission_agent, MINT_PRICE)
        nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))
        nft_info = get_nft_info(nft)

        self.assertEqual(nft_info['addrOwner'], wallet_commission_agent.address.str())
        self.assertEqual(wallet_commission_agent.balance, DEFAULT_WALLET_BALANCE)
        self.assertEqual(nft_root.balance, DEFAULT_NFT_ROOT_BALANCE - MIN_FOR_DATA_DEPLOY)

    #  checking error throw if minter tries to mint nft without enough money
    def test_error_throw_if_minting_with_low_balance(self):
        wallet_minter, nft_root = itemgetter('minter', 'root')(prepare_for_minting())

        MINT_PRICE = MINT_COMMISSION + MIN_FOR_MINTING - 1
        mint_nft(nft_root, wallet_minter, MINT_PRICE, expected_err=107)


if __name__ == '__main__':
    print('\nNftMinting testing:')
    unittest.main()