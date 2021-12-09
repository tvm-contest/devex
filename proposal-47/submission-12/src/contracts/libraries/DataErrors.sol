pragma ton-solidity >=0.43.0;

library DataErr {
    uint16 constant NOT_OWNER = 200;
    uint16 constant NOT_TRUSTED = 201;
    uint16 constant NOR_OWNER_OR_TRUSTED= 202;
    uint16 constant OWNERSHIP_CANNOT_BE_TRANSFERRED = 203;
    uint16 constant RIGHTS_CANNOT_BE_GIVEN = 204;
    uint16 constant TRUSTED_NOT_EXISTS = 205;
    uint16 constant TRUSTED_CANNOT_TRANSFER_RIGHTS = 206;
    uint16 constant TRUSTED_CAN_TRANSFER_RIGHTS = 207;
    uint16 constant INVALID_ADDRESS = 208;
    uint16 constant LOW_VALUE_TO_DEPLOY = 209;
}
