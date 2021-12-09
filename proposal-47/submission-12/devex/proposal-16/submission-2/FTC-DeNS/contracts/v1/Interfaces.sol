pragma ton-solidity ^0.38.0;

import "./Structures.sol";

interface IDensRoot is IDataStructs {
    function auction(string name) external view returns(address);
    function auctionFailed(string name) external view;
    function auctionSink() external pure;
    function auctionSucceeded(string name, address winner, uint32 expiry) external;
    function auctionParticipationCallback(uint128 rhash, bool res) external;
    function auctionProcessCallback(uint128 rhash, bool res, uint32 expiry) external;
    function certAuctProcessCallback(bool res) external;
    function certificateProcessCallback(uint128 rhash, uint32 expiry) external;
    function directlyDeploy(string name, address _owner, uint32 expiry) external returns (address);
    function directlyReconfigure(string name, address _owner, uint32 expiry) external returns (address);
    function ensureExpiry(string name, uint32 expiry) external view;
    function generateHash(uint128 amount, uint256 nonce) external returns(uint256);
    function installAuction(TvmCell code) external;
    function installCertificate(TvmCell code) external;
    function installPlatform(TvmCell code) external;
    function regName(uint32 callbackFunctionId, RegRequest request) external;
    function reserveName(string name, uint32 until) external;
    function resolve(string name) external view returns(address);
    function resolveRPC(string name, address cert, uint8 ptype) external view responsible returns(address);
    function resolveSub(string name, address cert) external view returns(address);
    function requestCertificateUpgrade() external;
    function subCertRequest(string name, string subname, address _owner, uint32 expiry, address _par) external;
    function subCertSync(string name, string subname, address _owner, uint32 expiry, address _par) external;
}

interface IDensCertificate is IDataStructs {
    function auctionProcess(address new_owner, uint32 new_expiry) external responsible returns(bool);
    function getExpiry() external view responsible returns(uint32);
    function getName() external view responsible returns(string);
    function getParent() external view responsible returns(address);
    function getRegistered() external view responsible returns(uint32);
    function getRoot() external view responsible returns(address);
    function getValue() external view responsible returns(address);
    function inquiryExpiry(uint128 rhash) external view responsible returns(uint128, uint32);
    function prolong(uint32 length) external;
    function requestUpgrade() external view;
    function setExpiry(uint32 _expiry) external;
    function setValue(address new_value) external;
    function subCertRequest(string subname, uint32 subexpiry) external view;
    function subCertSynchronize(string subname, uint32 subexpiry) external view;
    function whois() external view responsible returns(Whois);
    function withdraw(address dest, uint128 value) external pure;
}

interface IDensAuction is IDataStructs {
    function destroy() external;
    function inquiryRequest(uint128 rhash, uint32 expiry) external view responsible returns (uint128, bool, uint32);
    function participateProxy(RegPartReq rpr, uint128 rhash, uint32 expiry) external responsible returns (uint128, bool);
    function bid(uint256 hash) external responsible returns(bool);
    function finalize() external responsible returns(bool);
    function reveal(uint128 amount, uint256 nonce) external responsible returns(bool);
}

interface IBidder {
    function returnBid(string name) external;
}

interface IAddBalance {    function addBalance() external pure;    }
interface ISetOwnerInt {    function setOwner(address new_owner) external;    }
interface IUpgradable {    function upgrade(TvmCell code) external;    }

interface ITransferOwnerInt {
    function acceptOwner() external;
    function getOwner() external view responsible returns(address);
    function getPendingOwner() external view responsible returns(address);
    function transferOwner(address new_owner) external;
}

interface ITransferOwnerExt {
    function acceptOwner() external;
    function getOwner() external view responsible returns(uint256);
    function getPendingOwner() external view responsible returns(uint256);
    function transferOwner(uint256 new_owner) external;
}

