pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

import "./DensPlatform.sol";
import "./DensCertificate.sol";
import "./DensAuction.sol";

contract DensRoot is IDensRoot, ITransferOwnerExt, IUpgradable, IAddBalance {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Variables

    TvmCell public platform_code;
    TvmCell public certificate_code;
    TvmCell public auction_code;

    uint256 public owner;
    uint256 public pending_owner;

    mapping(uint128 => RegRequestX) state_rx;
    mapping(address => TempData) temp_lookup;
    uint32 last_gc = 0;

    mapping(string => uint32) reserved;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor

    constructor() public {
        require(tvm.pubkey() != 0, Errors.NO_OWNER_SET);
        require(msg.pubkey() == tvm.pubkey(), Errors.NOT_MY_OWNER);
        tvm.accept();
        owner = msg.pubkey();
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fallback functions and add funds manually (IAddBalance)

    receive() external pure { revert(); }
    fallback() external pure { revert(); }

    function addBalance() external pure override { emit balanceAdded(msg.sender, msg.value); }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Install / upgrade subcontracts code (IDensRoot)

    function installPlatform(TvmCell code) external override onlyOwner {
        platform_code = code; emit platformCodeUpdated(tvm.hash(code)); }
    function installCertificate(TvmCell code) external override onlyOwner {
        certificate_code = code; emit certificateCodeUpdated(tvm.hash(code)); }
    function installAuction(TvmCell code) external override onlyOwner {
        auction_code = code; emit auctionCodeUpdated(tvm.hash(code)); }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Upgrade the root contract itself (IUpgradable)

    function upgrade(TvmCell code) external override onlyOwner {
        TvmBuilder b;
        b.store(platform_code, certificate_code, auction_code, owner, pending_owner);
        emit rootCodeUpdated(tvm.hash(code));
        tvm.setcode(code);
        tvm.setCurrentCode(code);
        onCodeUpgrade(b.toCell());
    }

    function onCodeUpgrade(TvmCell data) private {} // Special!

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Request upgrade from certificate contract (IDensRoot)

    function requestCertificateUpgrade() external override {
        emit certCodeUpgraded(msg.sender);
        IUpgradable(msg.sender).upgrade{value: 0, bounce: false, flag: MsgFlag.MsgBalance}(certificate_code);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Reserved names

    function reserveName(string name, uint32 until) external override onlyOwner {
        if (until == 1) until = 0xFFFFFFFF; // permanent
        emit nameReserved(name, until);
        if (until < now) {
            delete reserved[name];
        } else
            reserved[name] = until;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Resolve contract address by name (IResolver)

    function _resolve(string name, uint8 type_id, address parent) internal view returns(address) {
        TvmCell stateInit = tvm.buildStateInit({
            contr: DensPlatform,
            code: platform_code,
            varInit: {
                root: address(this),
                type_id: type_id,
                name: name,
                parent: parent
            }
        });
        return address(tvm.hash(stateInit));
    }

    function resolve(string name) external view override returns(address) {
        return _resolve(name, PlatformTypes.Certificate, address(this));
    }

    function resolveRPC(string name, address cert, uint8 ptype) external view responsible override returns(address) {
        if (cert == address(0)) cert = address(this);
        return {value: 0, bounce: false, flag: MsgFlag.MsgBalance} _resolve(name, ptype, cert);
    }

    function resolveSub(string name, address cert) external view override returns(address) {
        return _resolve(name, PlatformTypes.Certificate, cert);
    }

    function auction(string name) external view override returns(address) {
        return _resolve(name, PlatformTypes.Auction, address(this));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Registration flow. This is surely some crazy ping pong.

    function RXHash(RegRequestX rx) pure private inline returns(uint128) {
        TvmBuilder b; b.store(rx); return uint128(tvm.hash(b.toCell()) % (2 ** 128));
    }

    function gc() external onlyOwner {
        delete state_rx;
        delete temp_lookup;
        last_gc = now;
        emit garbage_collected();
    }

    function regName(uint32 callbackFunctionId, RegRequest request) external override {
        require(msg.value >= DeNS.RegNameMinValue, Errors.VALUE_TOO_LOW);
        uint8 fail = 0;
        // Check duration
        if (request.duration < 1) fail = Errors.TOO_LOW_DURATION;
        if (request.duration > DeNS.MaxDurationValue) fail = Errors.TOO_HIGH_DURATION;
        if (fail == 0) {
            // Check forbidden characters . and /, also disallow control characters (< 32, 127 [<-])
            TvmBuilder b; b.store(request.name); TvmSlice s = b.toSlice().loadRefAsSlice();
            if (s.bits() % 8 != 0) fail = Errors.INVALID_STRLEN;
            else if (s.bits() == 0) fail = Errors.INVALID_STRLEN;
            else {
                uint8 c = 0;
                while (s.bits() > 0) {
                    c = s.loadUnsigned(8);
                    if ((c < 32) || (c == 46) || (c == 47) || (c == 127)) {
                        fail = Errors.FORBIDDEN_CHARS;
                        break;
                    }
                }
            }
        }
        if (fail == 0) {
            optional(uint32) resn = reserved.fetch(request.name);
            if (resn.hasValue())
                if (resn.get() > now)
                    fail = Errors.RESERVED_NAME;
        }
        if (fail != 0) {
            emit regNameRejected(msg.sender, request.name, request.duration, fail);
            //                      uint32              bool   uint8 address
            TvmBuilder b1; b1.store(callbackFunctionId, false, fail, address(0));
            msg.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b1.toCell()});
            return;
        }
        emit regNameRequest(msg.sender, request.name, request.duration);
        RegRequestX reqx = RegRequestX(request, msg.sender, callbackFunctionId);
        uint128 rhash = RXHash(reqx); state_rx[rhash] = reqx;
        address auct = _resolve(request.name, PlatformTypes.Auction, address(this));
        IDensAuction(auct).inquiryRequest{value: 0, bounce: true,
            flag: MsgFlag.MsgBalance, callback: DensRoot.auctionProcessCallback}(rhash, 0);
    }

    function auctionProcessCallback(uint128 rhash, bool res, uint32 expiry) external override {
        RegRequestX reqx = state_rx[rhash];
        // Auction SC exists and returned some value
        require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        if (!res) {
            delete state_rx[rhash];
            //                    uint32                   bool uint8                  address
            TvmBuilder b; b.store(reqx.callbackFunctionId, res, PlatformTypes.Auction, msg.sender);
            reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
            return;
        }
        RegPartReq rpr = RegPartReq(reqx.sender, reqx.r.duration, reqx.r.hash);
        IDensAuction(msg.sender).participateProxy{value: 0, bounce: true,
            flag: MsgFlag.MsgBalance, callback: DensRoot.auctionParticipationCallback}(rpr, rhash, expiry);
    }

    function certificateProcessCallback(uint128 rhash, uint32 expiry) external override {
        RegRequestX reqx = state_rx[rhash];
        // delete state_rx[rhash]; vvv
        // Certificate SC exists and returned its expiry time
        require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Certificate, address(this)), Errors.INVALID_ADDRESS);
        if ((now >= expiry) || (expiry - now < DeNS.AuctionableTail)) {
            initializeAuction(reqx, rhash, expiry);
            return;
        }
        delete state_rx[rhash];
        //                    uint32                   bool   uint8                      address
        TvmBuilder b; b.store(reqx.callbackFunctionId, false, PlatformTypes.Certificate, msg.sender);
        reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
    }

    function auctionParticipationCallback(uint128 rhash, bool res) external override {
        RegRequestX reqx = state_rx[rhash];
        delete state_rx[rhash];
        require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        //                    uint32                   bool uint8                  address
        TvmBuilder b; b.store(reqx.callbackFunctionId, res, PlatformTypes.Auction, msg.sender);
        reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
    }

    function initializeAuction(RegRequestX reqx, uint128 rhash, uint32 expiry) private {
        DensPlatform p = new DensPlatform{
            value: DeNS.PlatformInitPrice,
            code: platform_code,
            varInit: {
                root: address(this),
                type_id: PlatformTypes.Auction,
                name: reqx.r.name,
                parent: address(this)
            }
        }();
        p.initialize{flag:MsgFlag.AddTranFees}(auction_code, address(0));
        // state_rx[rhash] = reqx;
        emit auctionDeployed(reqx.r.name, reqx.r.duration, reqx.sender, address(p));
        IDensAuction(address(p)).inquiryRequest{value: 0, bounce: true,
            flag: MsgFlag.MsgBalance, callback: DensRoot.auctionProcessCallback}(rhash, expiry);
    }

    onBounce(TvmSlice slice) external {
        uint32 functionId = slice.decode(uint32);
        if (functionId == tvm.functionId(IDensAuction.inquiryRequest)) {
            TvmBuilder b; b.store(slice); tvm.hexdump(b.toCell());
            (uint32 callbackFunctionId, uint128 rhash, ) = slice.decodeFunctionParams(IDensAuction.inquiryRequest);
            if (callbackFunctionId == tvm.functionId(DensRoot.auctionProcessCallback)) {
                RegRequestX reqx = state_rx[rhash];
                // Auction SC does not exist, we need to go deeper
                require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
                address cert = _resolve(reqx.r.name, PlatformTypes.Certificate, address(this));
                IDensCertificate(cert).inquiryExpiry{value: 0, bounce: true,
                    flag: MsgFlag.MsgBalance, callback: DensRoot.certificateProcessCallback}(rhash);
                return;
            }
        }
        if (functionId == tvm.functionId(IDensCertificate.inquiryExpiry)) {
            (uint32 callbackFunctionId, uint128 rhash) = slice.decodeFunctionParams(IDensCertificate.inquiryExpiry);
            if (callbackFunctionId == tvm.functionId(DensRoot.certificateProcessCallback)) {
                RegRequestX reqx = state_rx[rhash];
                // delete state_rx[rhash];
                // Certificate SC does not exist as well, we may start auction now
                require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Certificate, address(this)), Errors.INVALID_ADDRESS);
                initializeAuction(reqx, rhash, 0);
            }
        }
        if (functionId == tvm.functionId(IDensCertificate.auctionProcess)) {
            (uint32 callbackFunctionId) = slice.decode(uint32);
            if (callbackFunctionId == tvm.functionId(DensRoot.certAuctProcessCallback)) {
                TempData td = temp_lookup[msg.sender];
                delete temp_lookup[msg.sender];
                require(msg.sender == _resolve(td.name, PlatformTypes.Certificate, address(this)), Errors.INVALID_ADDRESS);
                deployCertificate(td.name, td.winner, td.expiry, address(this));
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Auction flow

    function ensureExpiry(string name, uint32 expiry) external view override {
        require(msg.sender == _resolve(name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        require(expiry <= now + DeNS.MaxPeriodYears * (DeNS.BidPeriodPerYear + DeNS.RevealPeriodPerYear)
            + DeNS.ReAuctionGrace, Errors.VALUE_ERROR);
        address cert = _resolve(name, PlatformTypes.Certificate, address(this));
        IDensCertificate(cert).setExpiry{value: 0, bounce: true, flag: MsgFlag.MsgBalance}(expiry);
    }

    function auctionFailed(string name) external view override {
        require(msg.sender == _resolve(name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        emit auctionFail(name, msg.sender);
        IDensAuction(msg.sender).destroy{value: 0, bounce: true, flag: MsgFlag.MsgBalance}();
    }

    function auctionSucceeded(string name, address winner, uint32 expiry) external override {
        require(msg.sender == _resolve(name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        address cert = _resolve(name, PlatformTypes.Certificate, address(this));
        temp_lookup[cert] = TempData(name, winner, expiry);
        emit auctionSuccess(name, winner, expiry, msg.sender);
        IDensCertificate(cert).auctionProcess{callback: DensRoot.certAuctProcessCallback, value: 0.1 ton, flag: 1}(winner, expiry);
        IDensAuction(msg.sender).destroy{value: 0, bounce: true, flag: MsgFlag.MsgBalance}();
    }

    function auctionSink() external pure override {
        emit receivedAuction(msg.value);
    }

    function certAuctProcessCallback(bool) external override {
        delete temp_lookup[msg.sender];
    }

    function certAuctProcessCallbackDummy(bool) external pure {}

    function deployCertificate(string name, address _owner, uint32 expiry, address parent) private returns(address) {
        tvm.accept();
        DensPlatform p = new DensPlatform{
            value: DeNS.PlatformInitPrice,
            code: platform_code,
            varInit: {
                root: address(this),
                type_id: PlatformTypes.Certificate,
                name: name,
                parent: parent
            },
            flag: MsgFlag.AddTranFees
        }();
        p.initialize{flag:MsgFlag.AddTranFees}(certificate_code, _owner);
        IDensCertificate(address(p)).auctionProcess{callback: DensRoot.certAuctProcessCallbackDummy, value: 0.1 ton, flag: 1}(_owner, expiry);
        emit certificateDeployed(name, _owner, expiry, parent, address(p));
        return p;
    }

    // For reserved names and playing with the contracts
    function directlyDeploy(string name, address _owner, uint32 expiry) external override onlyOwner returns (address) {
        return deployCertificate(name, _owner, expiry, address(this));
    }

    // For playing with the contracts
    function directlyReconfigure(string name, address _owner, uint32 expiry) external override onlyOwner returns (address) {
        address p = _resolve(name, PlatformTypes.Certificate, address(this));
        IDensCertificate(address(p)).auctionProcess{callback: DensRoot.certAuctProcessCallbackDummy, value: 0.1 ton, flag: 1}(_owner, expiry);
        emit certificateReconfigured(name, _owner, expiry, address(p));
        return p;
    }

    // Temporarily required until Debot is working. May be useful anyway.
    function generateHash(uint128 amount, uint256 nonce) external override returns(uint256) {
        TvmBuilder b; b.store(amount, nonce);
        uint256 rhash = tvm.hash(b.toCell());
        return rhash;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-certificates

    function subCertRequest(string name, string subname, address _owner, uint32 expiry, address _par) external override {
        require(msg.sender == _resolve(name, PlatformTypes.Certificate, _par), Errors.INVALID_ADDRESS);
        address p = deployCertificate(subname, _owner, expiry, msg.sender);
        p.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance});
    }

    function subCertSync(string name, string subname, address _owner, uint32 expiry, address _par) external override {
        require(msg.sender == _resolve(name, PlatformTypes.Certificate, _par), Errors.INVALID_ADDRESS);
        address p = _resolve(subname, PlatformTypes.Certificate, msg.sender);
        IDensCertificate(address(p)).auctionProcess{callback: DensRoot.certAuctProcessCallbackDummy, value: 0.1 ton, flag: 1}(_owner, expiry);
        msg.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance});
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Owner

    function getOwner() external view responsible override returns(uint256) {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} owner; }

    function transferOwner(uint256 new_owner) external override onlyOwner {
        emit prepareOwnerTransfer(new_owner);
        pending_owner = new_owner;
    }

    function acceptOwner() external override {
        require(msg.pubkey() == pending_owner, Errors.NOT_PENDING_OWNER);
        tvm.accept();
        emit ownerTransferred(owner, pending_owner);
        owner = pending_owner; pending_owner = 0;
    }

    function getPendingOwner() external view responsible override returns(uint256) {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} pending_owner; }

    modifier onlyOwner() {
        require(msg.pubkey() == owner, Errors.NOT_MY_OWNER);
        tvm.accept();
        _;
    }

    function withdraw(address dest, uint128 value) external pure onlyOwner {
        require(address(this).balance - value >= DeNS.KeepAtRoot);
        emit withdrawn(dest, value);
        dest.transfer(value, true);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Events

    event platformCodeUpdated(uint256 hash);
    event certificateCodeUpdated(uint256 hash);
    event auctionCodeUpdated(uint256 hash);
    event rootCodeUpdated(uint256 hash);

    event balanceAdded(address donor, uint128 value);
    event certCodeUpgraded(address cert);

    event prepareOwnerTransfer(uint256 to);
    event ownerTransferred(uint256 from, uint256 to);
    event withdrawn(address dest, uint128 value);

    event receivedAuction(uint128 amount);
    event certificateDeployed(string name, address owner, uint32 expiry, address parent, address cert);
    event auctionDeployed(string name, uint32 duration, address sender, address auct);

    event certificateReconfigured(string name, address owner, uint32 expiry, address cert);

    event auctionSuccess(string name, address winner, uint32 expiry, address auct);
    event auctionFail(string name, address auct);

    event garbage_collected();

    event regNameRequest(address sender, string name, uint32 duration);
    event regNameRejected(address sender, string name, uint32 duration, uint8 reason);

    event nameReserved(string name, uint32 until);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}