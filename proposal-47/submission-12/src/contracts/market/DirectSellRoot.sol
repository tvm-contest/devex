pragma ton-solidity >=0.43.0;

pragma AbiHeader time;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./DirectSell.sol";
import '../libraries/DirectSellErrors.sol';
import '../libraries/Constants.sol';

contract DirectSellRoot {

    string private _rootName;
    bytes private _rootIcon;
    TvmCell private _codeDirectSell;
    uint128 internal _totalSupply;

    constructor(
        string rootName,
        string rootIcon,
        TvmCell codeDirectSell
    ) 
        public
    {
        tvm.accept();

        _rootName = rootName;
        _rootIcon = rootIcon;
        _codeDirectSell = codeDirectSell;
        _totalSupply = 0;
    }

    function deployDirectSell(
        address directSellCreator,
        uint64 durationInSec,
        address addrNFT,
        uint128 price 

    )
        public
    {
        require(directSellCreator.value != 0, DirectSellErr.LOW_CONTRACT_BALANCE, "Creator balance is zero");
        require(addrNFT.value != 0, DirectSellErr.LOW_CONTRACT_BALANCE, "NFT balance is zero");
        require(price > 0, DirectSellErr.WRONG_NUMBER_IS_GIVEN, "Price must be greater than zero");
        require(durationInSec > 0, DirectSellErr.WRONG_NUMBER_IS_GIVEN, "Duration must be greater than zero");
        require(address(this).balance - msg.value >=  Constants.CONTRACT_MIN_BALANCE, DirectSellErr.LOW_CONTRACT_BALANCE, "Check contract balance");
        tvm.accept();

        tvm.rawReserve(address(this).balance - msg.value, 0);

        TvmCell stateDirectSell = tvm.buildStateInit({
            code: _codeDirectSell,
            contr: DirectSell,
            pubkey: tvm.pubkey(),
            varInit: {
                _addrRoot: address(this),
                _addrOwner: directSellCreator,
                _addrNFT: addrNFT
            }
        });

        new DirectSell {
            stateInit: stateDirectSell,
            value: Constants.MIN_FOR_DIRECT_SELL_DEPLOY
            }(price, now + durationInSec);

        _totalSupply++;
        directSellCreator.transfer({value: 0, flag: 128});
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

    function getRootName() 
        public view 
        returns(
        string name
    ){
        name = _rootName;
    }

    function getRootIcon() 
        public view 
        returns(
        string icon
    ){
        icon = _rootIcon;
    }

    function getInfo() 
        public view 
        returns(
        string name,
        string icon,
        uint128 totalSupply
    ){
        name = _rootName;
        icon = _rootIcon;
        totalSupply = _totalSupply;
    }

    modifier onlyOwner() {
        require(msg.pubkey() == tvm.pubkey(), DirectSellErr.ONLY_OWNER, "Only owner can do this operation");
        tvm.accept();
        _;
    }

}