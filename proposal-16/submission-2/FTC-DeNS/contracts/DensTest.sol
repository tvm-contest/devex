pragma ton-solidity ^0.38.0;

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

import "./DensRoot.sol";
import "./DensPlatform.sol";
import "./DensCertificate.sol";

contract DensTest is IDataStructs {

    address root;

    constructor(address _root) public acc {
        root = _root;
    }

    receive() external pure {  }
    fallback() external pure { revert(Errors.FALLBACK_FORBIDDEN); }

    function setValue(address dest, address value) external pure acc {
        DensCertificate(dest).setValue(value);
    }

    function setTarget(address dest, int16 typ, address value) external pure acc {
        DensCertificate(dest).setTarget(typ, value);
    }

    function transferOwner(address dest, address new_owner) external pure acc {
        DensCertificate(dest).transferOwner(new_owner);
    }

    function acceptOwner(address dest) external pure acc {
        DensCertificate(dest).acceptOwner();
    }

    function regName(RegRequest req, uint128 amount, uint256 nonce) external view acc {
        TvmBuilder b; b.store(address(this), amount, nonce); req.hash = tvm.hash(b.toCell());
        IDensRoot(root).regName{value: 5 ton}(tvm.functionId(DensTest.regNameCallback), req);
    }

    function regNameCallback(bool b, uint8 u, address a) external pure {
        tvm.log(format("regName response: ok={}, code={}, addr={}", b?1:0, u, a));
    }

    function bid(address dest, uint128 amount, uint256 nonce) external pure acc {
        TvmBuilder b; b.store(address(this), amount, nonce); uint256 hash = tvm.hash(b.toCell());
        IDensAuction(dest).bid{value: 1 ton, callback: DensTest.bidCallback}(hash);
    }

    function bidCallback(bool res) external pure {
        tvm.log(format("auction bid response: ok={}", res?1:0));
    }

    function bid2(address dest, uint128 amount, uint256 nonce) external pure acc {
        TvmBuilder b; b.store(address(this), amount, nonce); uint256 hash = tvm.hash(b.toCell());
        IDensBid(dest).bid{value: 1 ton, callback: DensTest.bid2Callback}(hash);
    }

    function bid2Callback(bool res) external pure {
        tvm.log(format("bid bid response: ok={}", res?1:0));
    }

    function reveal(address dest, uint128 amount, uint256 nonce) external pure acc {
        IDensBid(dest).reveal{value: amount + 1 ton}(amount, nonce);
    }

//    function revealCallback(bool res) external pure {
//        tvm.log(format("reveal response: ok={}", res?1:0));
//    }

    function finalize(address dest) external pure acc {
        IDensAuction(dest).finalize{value: 1 ton, callback: DensTest.finalizeCallback}();
    }

    function finalizeCallback(bool res) external pure {
        tvm.log(format("finalize response: ok={}", res?1:0));
    }

    function requestSubCertificate(address dest, string name, uint32 expiry) external pure acc {
        IDensCertificate(dest).subCertRequest(name, expiry);
    }

    function syncSubCertificate(address dest, string name, uint32 expiry) external pure acc {
        IDensCertificate(dest).subCertSynchronize(name, expiry);
    }

    function withdraw(address dest) external pure acc {
        IDensBid(dest).withdraw{value: 1 ton}();
    }

    modifier acc() { tvm.accept(); _; }

}