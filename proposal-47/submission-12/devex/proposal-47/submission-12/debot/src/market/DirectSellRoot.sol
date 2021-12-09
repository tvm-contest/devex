pragma ton-solidity >=0.43.0;

pragma AbiHeader time;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "DirectSell.sol";
import '../libraries/DirectSellErrors.sol';
import '../libraries/Constants.sol';

contract DirectSellRoot {

    TvmCell _codeDirectSell;

    constructor(
        TvmCell codeDirectSell
    ) 
        public
    {
        tvm.accept();
        _codeDirectSell = codeDirectSell;
    }

    modifier deploymentSolvency {
        require(msg.value >= Constants.MIN_FOR_DEPLOY + Constants.MIN_MESSAGE_VALUE, DirectSellErr.LOW_MESSAGE_VALUE);       
        _;
    } 

    function deployDirectSell(
        address addrNFT,
        uint128 price
    )
        public view
        deploymentSolvency
    {
        tvm.accept();

        tvm.rawReserve(address(this).balance - msg.value, 0);

        TvmCell stateDirectSell = tvm.buildStateInit({
            code: _codeDirectSell,
            contr: DirectSell,
            pubkey: tvm.pubkey(),
            varInit: {
                _addrRoot: address(this),
                _addrOwner: msg.sender,
                _addrNFT: addrNFT
            }
        });

        new DirectSell {
            stateInit: stateDirectSell,
            value: Constants.MIN_FOR_DEPLOY
            }(
                price
            );

        msg.sender.transfer({value: 0, flag: 128});
    }

    function getDirectSellAddress(
        address addrOwner, 
        address addrNFT
    ) 
        public view 
        returns (
            address addrDirectSell
        ) 
    {
        TvmCell stateDirectSell = tvm.buildStateInit({
            code: _codeDirectSell,
            contr: DirectSell,
            pubkey: tvm.pubkey(),
            varInit: {
                _addrRoot: address(this),
                _addrOwner: addrOwner,
                _addrNFT: addrNFT
            }
        });
        addrDirectSell = address(tvm.hash(stateDirectSell));
    }

}