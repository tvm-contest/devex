pragma ton-solidity ^0.38.0;

library MF {
    uint8 constant AddTranFees  = 1;
    uint8 constant IgnoreErrors = 2;
    uint8 constant DestroyZero  = 32;
    uint8 constant MsgBalance   = 64;
    uint8 constant AllBalance   = 128;
    uint8 constant SelfDestruct = 128 + 32;
}