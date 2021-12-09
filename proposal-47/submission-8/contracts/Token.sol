pragma ton-solidity >= 0.44.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "INFTCollcetion.sol";
import "UserCert.sol";
import "Constants.sol";

contract Token {

    //code salt _root;
    uint8[] static _images;

    address _owner;
    TvmCell _certCode;

    modifier onlyOwner() {
        require(msg.sender == _owner, 102);
        _;
    }

    constructor(address owner,TvmCell certCode) public
    {
        optional(TvmCell) optSalt = tvm.codeSalt(tvm.code());
        require(optSalt.hasValue(), 101);
        address root = optSalt.get().toSlice().decode(address);
        require(msg.sender == root, 102);
        _certCode = certCode;
        _owner = owner;
        TvmBuilder salt;
        salt.store(_owner);
        TvmCell newCode =  tvm.setCodeSalt(_certCode, salt.toCell());
        new UserCert{
            code: newCode,
            value: Constants.CERT_DEPLOY_VALUE,
            pubkey: tvm.pubkey(),
            varInit: {
                _token: address(this)
            }
        }();
        INFTCollection(root).removeQuery{value: Constants.REMOVE_QUERY_VALUE, flag: 1}();
    }

    function changeOwner(address newOwner) public onlyOwner {

        require(msg.value >= Constants.CHANGE_OWNER_VALUE, 103);
        TvmBuilder oldSalt;
        oldSalt.store(_owner);
        TvmCell oldCode =  tvm.setCodeSalt(_certCode, oldSalt.toCell());
        TvmCell stateInit = tvm.buildStateInit({
            code: oldCode,
            contr: UserCert,
            pubkey: tvm.pubkey(),
            varInit: {
                _token: address(this)
            }
        });
        address addr = address(tvm.hash(stateInit));
        UserCert(addr).remove{value: Constants.CERT_REMOVE_VALUE, flag: 1}();

        _owner = newOwner;

        TvmBuilder salt;
        salt.store(_owner);
        TvmCell newCode =  tvm.setCodeSalt(_certCode, salt.toCell());
        new UserCert{
            code: newCode,
            value: Constants.CERT_DEPLOY_VALUE,
            pubkey: tvm.pubkey(),
            varInit: {
                _token: address(this)
            }
        }();

    }

    function isExist() public responsible pure returns(bool) {
        return{value: 0, flag: 64} true;
    }

    function getOwner() public responsible view returns(address) {
        return{value: 0, flag: 64} _owner;
    }

    function getInfo() public responsible view returns(address, address, uint8[] ) {
        optional(TvmCell) optSalt = tvm.codeSalt(tvm.code());
        require(optSalt.hasValue(), 101);
        address root = optSalt.get().toSlice().decode(address);
        return{value: 0, flag: 64} (root, _owner, _images);
    }
}
