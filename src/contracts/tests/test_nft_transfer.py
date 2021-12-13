
import unittest
import tonos_ts4.ts4 as ts4

from utils.wallet import create_wallet
from utils.nft_root import create_nft_root, mint_nft, get_nft_addr
from utils.nft import restore_nft_by_addr, transfer_nft, get_nft_info, lend_ownership, get_trusted_addr, return_ownership

from random import randint
unittest.TestLoader.sortTestMethodsUsing = lambda _, x, y: randint(-1, 1)

eq = ts4.eq

ts4.init('test_build', verbose = False)

ZERO_ADDRES = ts4.Address.zero_addr(0)
MINT_PRICE = 20 * ts4.GRAM
TRANSFER_PRICE = 2 * ts4.GRAM
LEND_PRICE = 2 * ts4.GRAM
RETURN_PRICE = 2 * ts4.GRAM

def prepare_for_test():
    prepared_info = dict()
    
    wallet_owner = create_wallet()
    wallet_receiver = create_wallet()
    wallet_trusted = create_wallet()
    wallet_agent = create_wallet()

    nft_root = create_nft_root(wallet_agent.address)
    mint_nft(wallet_owner, nft_root, MINT_PRICE)
    nft = restore_nft_by_addr(get_nft_addr(nft_root, 0))

    prepared_info = {
        'wallet_owner': wallet_owner,
        'wallet_receiver': wallet_receiver,
        'wallet_trusted': wallet_trusted,
        'nft_root': nft_root,
        'nft': nft
    }
    return prepared_info


class TestNftTransfer(unittest.TestCase):   

    def tearDown(self):
        ts4.reset_all()

    #  checking for the NFT transfer correctness
    def test_can_test_transfer_nft(self):
        prepared_info = prepare_for_test()
        wallet_owner = prepared_info['wallet_owner']
        wallet_receiver = prepared_info['wallet_receiver']
        nft = prepared_info['nft']

        transfer_nft(wallet_owner, wallet_receiver, nft, TRANSFER_PRICE)

        nft_info = get_nft_info(nft)
        self.assertEqual(nft_info['addrOwner'], wallet_receiver.address.str())

    def test_can_lend_ownership(self):
        prepared_info = prepare_for_test()
        wallet_owner = prepared_info['wallet_owner']
        wallet_trusted = prepared_info['wallet_trusted']
        nft = prepared_info['nft']

        lend_ownership(wallet_owner, wallet_trusted, nft, LEND_PRICE)

        trusted_addr = get_trusted_addr(nft)
        self.assertEqual(trusted_addr, wallet_trusted.address)

    def test_trusted_can_transfer_nft(self):
        prepared_info = prepare_for_test()
        wallet_owner = prepared_info['wallet_owner']
        wallet_trusted = prepared_info['wallet_trusted']
        wallet_receiver = prepared_info['wallet_receiver']
        nft = prepared_info['nft']

        lend_ownership(wallet_owner, wallet_trusted, nft, LEND_PRICE)
        transfer_nft(wallet_trusted, wallet_receiver, nft, TRANSFER_PRICE)

        nft_info = get_nft_info(nft)
        self.assertEqual(nft_info['addrOwner'], wallet_receiver.address.str())

    def test_trusted_can_returned_nft_ownership(self):
        prepared_info = prepare_for_test()
        wallet_owner = prepared_info['wallet_owner']
        wallet_trusted = prepared_info['wallet_trusted']
        nft = prepared_info['nft']

        lend_ownership(wallet_owner, wallet_trusted, nft, LEND_PRICE)
        return_ownership(wallet_trusted, nft, RETURN_PRICE)

        trusted_addr = get_trusted_addr(nft)
        self.assertEqual(trusted_addr, ZERO_ADDRES)


if __name__ == '__main__':
    unittest.main()