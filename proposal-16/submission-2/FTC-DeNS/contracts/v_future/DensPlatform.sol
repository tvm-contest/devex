pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./constants/ER.sol";
import "./constants/MF.sol";

import "./interfaces/IDestructible.sol";
import "./interfaces/IRegPing.sol";
import "./interfaces/ISink.sol";

//       *--------------*
//     / DeNS         /
//   /    Platform  /
// *--------------*
// | 'HelloWorld' | <- Platform
// *--------------*

contract DensPlatform is IDestructible, IRegPing {

    //------------------------------------------------------------------------------------------------------------------
    // varInit - initial contract state data that is used to derive contract address

    // root address, is also checked against when deploying or initializing the contract
    address public static root;

    // type identifier, currently used values are 1 for Certificate and 2 for Auction
    uint8 public static type_id;

    // domain name (not fully-qualified, only for current level)
    string public static name;

    // direct parent of this object
    address public static parent;

    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    // constructor, checks if contract is actually deployed by the varInit root

    constructor()
        public
    {
        require(msg.sender == root, ER.NOT_ROOT);
        tvm.accept();
    }

    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    // initialization of the actual contract

    function initialize(TvmCell code, address owner)
        external
    {
        require(msg.sender == root, ER.NOT_ROOT);
        tvm.accept();
        tvm.setcode(code);
        tvm.setCurrentCode(code);
        TvmBuilder b;
        b.store(root, name, owner, parent);
        onCodeUpgrade(b.toCell());
    }

    function onCodeUpgrade(TvmCell data) private {}

    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------
    // special behaviour if constructor is somehow circumvented or initialize fails

    function registrationPing(uint128 requestHash)
        external view responsible override
        returns (uint128, uint32)
    {
        require(msg.sender == root, ER.NOT_ROOT);
        return {value: 0, bounce: true, flag: MF.MsgBalance} (rhash, 0);
    }

    function destroy()
        external view override
    {
        require(msg.sender == root, ER.NOT_ROOT);
        // msg.sender.transfer({value: 0, bounce: false, flag: MF.SelfDestruct});
        ISink(root).sink{value: 0, bounce: false, flag: MF.SelfDestruct}();
    }

    //------------------------------------------------------------------------------------------------------------------

}