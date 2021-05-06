pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

//       *--------------*
//     / |            / |
//   /   |          /   | <- Certificate
// *--------------*     |
// | DeNS         |     *
// |  Certificate |   / *
// |  ( Type 1 )  | / /
// *--------------* /
// *--------------*
// | 'HelloWorld' | <- Platform type 1
// *--------------*

contract DensCertificate is IDensCertificate, ITransferOwnerInt, IUpgradable, ISetOwnerInt, IAddBalance {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Variables

    address public root;
    string public name;
    address public owner;
    address public parent;
    address public value;
    address public pending_owner;
    uint32 public registered;
    uint32 public expiry;

    mapping(int16 => address) public values; // type != 0, because for type == 0 there is value

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor - can't be constructed directly, must be installed to a platform

    constructor() public { revert(Errors.DEPLOY_FORBIDDEN); }  // Cannot be deployed directly!

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fallback functions and add funds manually (IAddBalance)

    receive()
        external view
    {
        if (msg.sender != root)
            revert(Errors.RECEIVE_FORBIDDEN);
        emit balanceAdded(msg.sender, msg.value);
    }

    fallback() external pure { revert(Errors.FALLBACK_FORBIDDEN); }

    function addBalance()
        external pure override
    {
        emit balanceAdded(msg.sender, msg.value);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IUpgradable only by root

    function upgrade(TvmCell code)
        external override onlyRoot
    {
        tvm.accept();
        TvmBuilder b;
        uint256 iden = smc_identify();
        b.store(root, name, owner, parent, value, registered, expiry);
        tvm.setCurrentCode(code);
        require(smc_identify() == iden, Errors.INVALID_CODE);
        tvm.setcode(code);
        onCodeUpgrade(b.toCell());
    }

    function onCodeUpgrade(TvmCell data)
        private
    {
        tvm.resetStorage();
        TvmSlice s = data.toSlice();
        (root, name, owner, parent) = s.decode(address, string, address, address);
        value = s.bits() > 0 ? s.decode(address) : address(0);
        registered = s.bits() > 0 ? s.decode(uint32) : uint32(Now());
        expiry = s.bits() > 0 ? s.decode(uint32) : uint32(0);
        emit deployed(root, name, owner, expiry, value != address(0));
    }

    function smc_identify()
        pure private
        returns(uint256)
    {
        return tvm.hash("DeNS Certificate Smart Contract");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IDensCertificate owner can request upgrade from root
    function requestUpgrade()
        external view override onlyOwner retRem
    {
        IDensRoot(root).requestCertificateUpgrade{value: 0, flag: MsgFlag.MsgBalance}();
        emit upgradeRequested();
    }

    function subCertRequest(string subname, uint32 subexpiry)
        external view override onlyOwner
    {
        if (subexpiry > expiry)
            subexpiry = expiry;
        emit subCertRequested(subname, subexpiry);
        IDensRoot(root).subCertRequest{value: 0, bounce: false, flag: MsgFlag.MsgBalance}
            (name, subname, owner, math.max(expiry, subexpiry), parent);
    }

    function subCertSynchronize(string subname, uint32 subexpiry)
        external view override onlyOwner
    {
        if (subexpiry > expiry)
            subexpiry = expiry;
        emit subCertSynchronized(subname, subexpiry);
        IDensRoot(root).subCertSync{value: 0, bounce: false, flag: MsgFlag.MsgBalance}
            (name, subname, owner, math.max(expiry, subexpiry), parent);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ISetOwnerInt only by root

    function getOwner()
        external view responsible override
        returns(address)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} owner;
    }

    function setOwner(address new_owner)
        external override onlyRoot retRem
    {
        owner = new_owner;
        value = address(0);
        delete values;
        emit ownerForceChanged(new_owner);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ITransferOwnerInt by owner

    function getPendingOwner()
        external view responsible override
        returns(address)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} pending_owner;
    }

    function transferOwner(address new_owner)
        external override onlyOwner retRem
    {
        emit prepareOwnerTransfer(new_owner);
        pending_owner = new_owner;
    }

    function acceptOwner()
        external override retRem
    {
        require(msg.sender == pending_owner, Errors.NOT_PENDING_OWNER);
        emit ownerTransferred(owner, pending_owner);
        owner = pending_owner;
        pending_owner = address(0);
    }

    function withdraw(address dest, uint128 _value)
        external pure override onlyOwner
    {
        require(address(this).balance - _value >= DeNS.KeepAtCertificate, Errors.REMAIN_TOO_LOW);
        emit withdrawn(dest, _value);
        dest.transfer(_value, true);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IDensCertificate get and set address

    function getValue()
        external view responsible override
        returns(address)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} value;
    }

    function setValue(address new_value)
        external override onlyOwner retRem
    {
        value = new_value;
        emit modified(new_value);
        emit modified_ex(0, new_value);
    }

    function getTarget(int16 rec_type)
        external view responsible override
        returns(address)
    {
        if (rec_type == 0) return value;
        return values[rec_type];
    }

    function setTarget(int16 rec_type, address new_value)
        external override onlyOwner retRem
    {
        if (rec_type == 0) {
            value = new_value;
            emit modified(new_value);
            emit modified_ex(0, new_value);
            return;
        }
        values[rec_type] = new_value;
        emit modified_ex(rec_type, new_value);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IDensCertificate get and set expiry

    function getExpiry()
        external view responsible override
        returns(uint32)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} expiry;
    }

    function setExpiry(uint32 _expiry)
        external override onlyRoot retRem
    {
        expiry = _expiry;
        emit expiryChanged(expiry, false);
    }

    function prolong(uint32 length)
        external override onlyRoot retRem
    {
        if (expiry == 0)
            expiry = Now();
        expiry += length;
        emit expiryChanged(expiry, true);
    }

    function getRegistered()
        external view responsible override
        returns(uint32)
    {
        return registered;
    }

    function inquiryExpiry(uint128 rhash)
        external view responsible override
        returns(uint128, uint32)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} (rhash, expiry);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // IDensCertificate read-only getters

    function getParent()
        external view responsible override
        returns(address)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} parent;
    }

    function getRoot()
        external view responsible override
        returns(address)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} root;
    }

    function getName()
        external view responsible override
        returns(string)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} name;
    }

    function whois()
        external view responsible override
        returns(Whois)
    {
        return Whois(name, owner, parent, value, registered, expiry);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Auction process

    function auctionProcess(address new_owner, uint32 new_expiry)
        external responsible override onlyRoot
        returns(bool)
    {
        tvm.accept();
        if (owner != new_owner) {
            value = address(0);
            delete values;
            owner = new_owner;
            pending_owner = address(0);
        }
        expiry = new_expiry;
        emit auctionSet(new_owner, new_expiry);
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} true;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Modifiers

    modifier onlyOwner()
    {
        require(msg.sender == owner, Errors.NOT_MY_OWNER);
        _;
    }

    modifier onlyRoot()
    {
        require(msg.sender == root, Errors.NOT_ROOT);
        _;
    }

    modifier retRem()
    {
        _;
        msg.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance});
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Events

    event deployed(address root, string name, address owner, uint32 expiry, bool upgraded);
    event upgradeRequested();
    event modified(address value);
    event modified_ex(int16 rec_type, address value);
    event prepareOwnerTransfer(address to);
    event ownerTransferred(address from, address to);
    event ownerForceChanged(address new_owner);
    event expiryChanged(uint32 new_expiry, bool prolong);
    event withdrawn(address dest, uint128 value);

    event auctionSet(address owner, uint32 expiry);
    event subCertRequested(string subname, uint32 subexpiry);
    event subCertSynchronized(string subname, uint32 subexpiry);
    event balanceAdded(address donor, uint128 value);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Now() for IT

    function Now() pure virtual internal inline returns (uint32) { return now; }

}