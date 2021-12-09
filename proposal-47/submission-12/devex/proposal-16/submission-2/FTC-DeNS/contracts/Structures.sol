pragma ton-solidity ^0.38.0;

interface IDataStructs {

    struct RegRequest {
        string name;
        uint32 duration;
        uint256 hash;
    }

    struct RegPartReq {
        address sender;
        uint32 duration;
        uint256 hash;
    }

    struct RegRequestX {
        RegRequest r;
        address sender;
        uint32 callbackFunctionId;
    }

    struct TempData {
        string name;
        address winner;
        uint32 expiry;
    }

    struct Whois {
        string name;
        address owner;
        address parent;
        address value;
        uint32 registered;
        uint32 expiry;
    }

}