pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

//       *--------------*
//     / DeNS         /
//   /    Platform  /
// *--------------*
// | 'HelloWorld' | <- Platform
// *--------------*

contract DensPlatform {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // varInit (address derival variables)

    address public static root;
    uint8 public static type_id; // 1: Certificate / 2: Auction
    string public static name;
    address public static parent;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor

    constructor() public {
        require(msg.sender == root, Errors.NOT_ROOT);
        tvm.accept();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Initialization (first code upgrade - install contract to platform)
    // Differs from IUpgradable by passing owner - do not make too much messages (upgrade, setOwner)

    function initialize(TvmCell code, address owner) external {
        require(msg.sender == root, Errors.NOT_ROOT);
        tvm.accept();
        tvm.setcode(code);
        tvm.setCurrentCode(code);
        TvmBuilder b;
        b.store(root, name, owner, parent);
        onCodeUpgrade(b.toCell());
    }

    function onCodeUpgrade(TvmCell data) private {}

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}