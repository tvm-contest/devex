pragma ton-solidity >= 0.43.0;

pragma AbiHeader time;

import 'NftRoot.sol';

contract User {
     constructor() public {
        tvm.accept();
    }

    function createNft(NftRoot addrRoot, string rarity, int color) public{
        tvm.accept();
        TvmCell msg = tvm.buildIntMsg({
            dest: addrRoot,
            value: 1.1 ton,
            call:{addrRoot.mintNft, rarity, color}
        });

        tvm.sendrawmsg(msg, 0);
    }
}