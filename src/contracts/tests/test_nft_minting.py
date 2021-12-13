
import unittest
import tonos_ts4.ts4 as ts4

from utils.wallet import create_wallet, DEFAULT_WALLET_BALANCE
from utils.nft_root import create_nft_root, mint_nft, get_nft_addr, DEFAULT_NFT_ROOT_BALANCE
from utils.nft import restore_nft_by_addr, get_nft_info

from random import randint
unittest.TestLoader.sortTestMethodsUsing = lambda _, x, y: randint(-1, 1)

eq = ts4.eq

ts4.init('test_build', verbose = False)

ZERO_ADDRES = ts4.Address.zero_addr(0)
MINT_PRICE = 20 * ts4.GRAM
MINT_COMMISSION = 5 * ts4.GRAM
MIN_FOR_DATA_DEPLOY = 1.5 * ts4.GRAM

# error codes
NOT_ENOUGH_VALUE_TO_MINT = 107

def prepare_for_test():
    prepared_info = dict()
    
    wallet_minter = create_wallet()
    wallet_agent = create_wallet()

    prepared_info = {
        'wallet_minter': wallet_minter,
        'wallet_agent': wallet_agent,
    }
    return prepared_info


class TestNftMinting(unittest.TestCase):   

    def tearDown(self):
        ts4.reset_all()

    #  checking the NFT minting correctness
    def test_wallet_can_mint_nft(self):
        prepared_info = prepare_for_test()
        wallet_minter = prepared_info['wallet_minter']
        wallet_agent = prepared_info['wallet_agent']

        nft_root = create_nft_root(wallet_agent.address)
        mint_nft(wallet_minter, nft_root, MINT_PRICE)
        nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))

        nft_info = get_nft_info(nft)
        self.assertEqual(nft_info['addrOwner'], wallet_minter.address.str())

    #  checking the withdraw from minter's wallet with commission
    def test_minter_wallet_withdraw_with_commission(self):
        prepared_info = prepare_for_test()
        wallet_minter = prepared_info['wallet_minter']
        wallet_agent = prepared_info['wallet_agent']

        nft_root = create_nft_root(wallet_agent.address, MINT_COMMISSION)
        mint_nft(wallet_minter, nft_root, MINT_PRICE)

        self.assertEqual(wallet_minter.balance, DEFAULT_WALLET_BALANCE - MIN_FOR_DATA_DEPLOY - MINT_COMMISSION)
        self.assertEqual(wallet_agent.balance, MINT_COMMISSION + DEFAULT_WALLET_BALANCE)
        self.assertEqual(nft_root.balance, DEFAULT_NFT_ROOT_BALANCE)
    
    #  checking the withdraw from agent's wallet without commission
    def test_agent_wallet_withdraw_with_commission(self):
        prepared_info = prepare_for_test()
        wallet_agent = prepared_info['wallet_agent']

        nft_root = create_nft_root(wallet_agent.address, MINT_COMMISSION)
        mint_nft(wallet_agent, nft_root, MINT_PRICE)

        self.assertEqual(wallet_agent.balance, DEFAULT_WALLET_BALANCE - MIN_FOR_DATA_DEPLOY)
        self.assertEqual(nft_root.balance, DEFAULT_NFT_ROOT_BALANCE)

    #  checking the withdraw from nft root balance if agent sent not enought
    def test_agent_can_mint_using_nft_root_balance(self):
        prepared_info = prepare_for_test()
        wallet_agent = prepared_info['wallet_agent']

        nft_root = create_nft_root(wallet_agent.address, MINT_COMMISSION)
        mint_nft(wallet_agent, nft_root, 0)

        self.assertEqual(DEFAULT_WALLET_BALANCE, wallet_agent.balance)
        self.assertEqual(nft_root.balance, DEFAULT_NFT_ROOT_BALANCE - MIN_FOR_DATA_DEPLOY)

if __name__ == '__main__':
    unittest.main()