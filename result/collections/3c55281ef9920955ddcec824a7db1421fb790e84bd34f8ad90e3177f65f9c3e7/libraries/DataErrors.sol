pragma ton-solidity >=0.43.0;

library DataErr {
    uint16 constant NOT_OWNER = 200;
    uint16 constant NOT_TRUSTED = 201;
    uint16 constant NOR_OWNER_OR_TRUSTED= 202;
    uint16 constant OWNERSHIP_CANNOT_BE_TRANSFERRED = 203;
    uint16 constant RIGHTS_CANNOT_BE_GIVEN = 204;
    uint16 constant TRUSTED_EXISTS = 205;
    uint16 constant TRUSTED_CANNOT_TRANSFER_RIGHTS = 206;
    uint16 constant TRUSTED_CAN_TRANSFER_RIGHTS = 207;
    uint16 constant NULL_ADDRESS = 208;
    uint16 constant NOT_ENOUGH_VALUE_TO_DEPLOY_DATA = 209;
    uint16 constant MANAGER_NOT_EXISTS = 210;
    uint16 constant MANAGER_ALREADY_EXISTS = 211;
    uint16 constant NOT_ENOUGH_VALUE_TO_RETURN_OWNERSHIP = 212;
    uint16 constant NOT_OWNER_NOR_MANAGER = 213;
    uint16 constant NOT_ENOUGH_VALUE_TO_TRANSFER_OWNERSHIP = 214;
}
