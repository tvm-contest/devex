pragma ton-solidity >=0.42.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
interface IUserInfo 
{
    function getAccount   (uint32 answerId) external returns (address value);
    function getPublicKey (uint32 answerId) external returns (uint256 value);
    function getSigningBox(uint32 answerId) external returns (uint32 handle);
}

//================================================================================
//
library UserInfo 
{
    uint256 constant ID       = 0xa56115147709ed3437efb89460b94a120b7fe94379c795d1ebb0435a847ee580;
    int8    constant DEBOT_WC = -31;
    address constant addr     = address.makeAddrStd(DEBOT_WC, ID);

    function getAccount   (uint32 answerId) public {    IUserInfo(addr).getAccount   (answerId);    }
    function getPublicKey (uint32 answerId) public {    IUserInfo(addr).getPublicKey (answerId);    }
    function getSigningBox(uint32 answerId) public {    IUserInfo(addr).getSigningBox(answerId);    }
}

//================================================================================
//
