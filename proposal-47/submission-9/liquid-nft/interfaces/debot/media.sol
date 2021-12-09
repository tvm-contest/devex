pragma ton-solidity >= 0.40.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

//================================================================================
//
enum MediaStatus 
{
    Success,
    UnsupportedMediaType,
    InvalidDataScheme
}

interface IMedia 
{
    function output                (uint32 answerId, string prompt, string data) external returns (MediaStatus result    );
    function getSupportedMediaTypes(uint32 answerId)                             external returns (string      mediaTypes);
}

//================================================================================
//
library Media 
{
    uint256 constant ID = 0x59cdc2aafe53760937dac5b1c4b89ce12950f56a56298108a987cfe49b7c84b5;
    int8    constant DEBOT_WC = -31;
    address constant addr     = address.makeAddrStd(DEBOT_WC, ID);

    function output(uint32 answerId, string prompt, string data) public 
    {
        IMedia(addr).output(answerId, prompt, data);
    }

    function getSupportedMediaTypes(uint32 answerId) public 
    {
        IMedia(addr).getSupportedMediaTypes(answerId);
    }
}

//================================================================================
//
