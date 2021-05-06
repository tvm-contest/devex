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

import "./SmvPack.sol";

contract DensRoot is IDensRoot, ITransferOwnerExt, IUpgradable, IAddBalance, IClient {

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Variables

    TvmCell public platform_code;
    TvmCell public certificate_code;
    TvmCell public auction_code;

    TvmCell public bid_code;

    uint256 public owner;
    uint256 public pending_owner;

    mapping(uint128 => RegRequestX) state_rx;
    mapping(address => TempData) temp_lookup;
    uint32 last_gc = 0;
    uint32 last_temp = 0;

    mapping(string => uint32) reserved;
    uint32 new_auctions_ban = 0;

    address smv_root;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Constructor

    constructor()
        public
    {
        require(tvm.pubkey() != 0, Errors.NO_OWNER_SET);
        require(msg.pubkey() == tvm.pubkey(), Errors.NOT_MY_OWNER);
        tvm.accept();
        owner = msg.pubkey();
        new_auctions_ban = 0;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Fallback functions and add funds manually (IAddBalance)

    receive() external pure { revert(Errors.RECEIVE_FORBIDDEN); }
    fallback() external pure { revert(Errors.FALLBACK_FORBIDDEN); }

    function addBalance()
        external pure override
    {
        emit balanceAdded(msg.sender, msg.value);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Install / upgrade subcontracts code (IDensRoot)

    function installPlatform(TvmCell code) // 0
        external override onlyOwner
    {
        platform_code = code;
        emit platformCodeUpdated(tvm.hash(code));
    }

    function installCertificate(TvmCell code) // 1
        external override onlyOwner
    {
        certificate_code = code;
        emit certificateCodeUpdated(tvm.hash(code));
    }

    function installAuction(TvmCell code) // 2
        external override onlyOwner
    {
        auction_code = code;
        emit auctionCodeUpdated(tvm.hash(code));
    }

    function installBid(TvmCell code) // 201
        external override onlyOwner
    {
        bid_code = code;
        emit bidCodeUpdated(tvm.hash(code));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Configure auctions ban

    function setNewAuctionsBan(uint32 until)
        external override onlyOwner
    {
        new_auctions_ban = until;
        emit newAuctionsBanned(until);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Configure SMV root

    function setSmvRoot(address smv)
        external override onlyOwner
    {
        smv_root = smv;
        emit smvRootSet(smv);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // SMV processing

    function onProposalPassed(ProposalInfo proposalInfo)
        external override onlySmvRoot
    {
        TvmCell c = proposalInfo.specific;
        // enum ProposalType { Undefined, SetCode, Reserve, SetOwner, SetRootOwner }
        if (proposalInfo.proposalType == ProposalType.SetCode) {
            SetCodeProposalSpecific c_setCode = c.toSlice().decode(SetCodeProposalSpecific);
            TvmCell code = c_setCode.code;
            uint8 ct = c_setCode.ContractType;
            if (ct == PlatformTypes.Platform) {
                platform_code = code;
                emit platformCodeUpdated(tvm.hash(code));
                return;
            }
            if (ct == PlatformTypes.Certificate) {
                certificate_code = code;
                emit certificateCodeUpdated(tvm.hash(code));
                return;
            }
            if (ct == PlatformTypes.Auction) {
                auction_code = code;
                emit auctionCodeUpdated(tvm.hash(code));
                return;
            }
            if (ct == PlatformTypes.Bid) {
                bid_code = code;
                emit bidCodeUpdated(tvm.hash(code));
                return;
            }
            if (ct == PlatformTypes.Root) {
                _upgrade(code);
                return;
            }
            return;
        }
        if (proposalInfo.proposalType == ProposalType.Reserve) {
            ReserveProposalSpecific c_reserve = c.toSlice().decode(ReserveProposalSpecific);
            _reserveName(c_reserve.name, c_reserve.ts);
            return;
        }
        if (proposalInfo.proposalType == ProposalType.DeployCert) {
            DeployCertProposalSpecific c_depcrt = c.toSlice().decode(DeployCertProposalSpecific);
            deployCertificate(c_depcrt.name, c_depcrt.owner, uint32(c_depcrt.ts), address(this));
            return;
        }
        if (proposalInfo.proposalType == ProposalType.SetRootOwner) {
            SetRootOwnerProposalSpecific c_setown = c.toSlice().decode(SetRootOwnerProposalSpecific);
            owner = c_setown.pubkey; pending_owner = 0;
            emit ownerChanged(owner);
            return;
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Upgrade the root contract itself (IUpgradable)

    function upgrade(TvmCell code) // 255
        external override onlyOwner
    {
        _upgrade(code);
    }

    function _upgrade(TvmCell code)
        private
    {
        TvmBuilder b;
        uint256 iden = smc_identify();
        b.store(platform_code, certificate_code, auction_code, owner, pending_owner);
        tvm.setCurrentCode(code);
        require(smc_identify() == iden, Errors.INVALID_CODE);
        emit rootCodeUpdated(tvm.hash(code));
        tvm.setcode(code);
        onCodeUpgrade(b.toCell());
    }

    function onCodeUpgrade(TvmCell data) private {} // Special!

    function smc_identify()
        pure private
        returns(uint256)
    {
        return tvm.hash("DeNS Root Smart Contract");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Request upgrade from certificate contract (IDensRoot)

    function requestCertificateUpgrade()
        external override
    {
        emit certCodeUpgraded(msg.sender);
        IUpgradable(msg.sender).upgrade{value: 0, bounce: false, flag: MsgFlag.MsgBalance}(certificate_code);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Reserved names

    function reserveName(string name, uint32 until)
        external override onlyOwner
    {
        _reserveName(name, until);
    }

    function _reserveName(string name, uint32 until)
        private
    {
        if (until == 1) until = 0xFFFFFFFF; // permanent
        emit nameReserved(name, until);
        if (until < Now()) {
            delete reserved[name];
        } else
            reserved[name] = until;
    }

    function getReservedNames()
        external responsible override
        returns(string[], uint32[])
    {
        string[] s;
        uint32[] e;
        for ((string key, uint32 exp) : reserved) {
            s.push(key);
            e.push(exp);
        }
        return (s, e);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Resolve contract address by name (IResolver)

    function _resolve(string name, uint8 type_id, address parent)
        internal view
        returns(address)
    {
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

    function resolve(string name)
        external view override
        returns(address)
    {
        return _resolve(name, PlatformTypes.Certificate, address(this));
    }

    function resolveRPC(string name, address cert, uint8 ptype)
        external view responsible override
        returns(address)
    {
        if (cert == address(0)) cert = address(this);
        return {value: 0, bounce: false, flag: MsgFlag.MsgBalance} _resolve(name, ptype, cert);
    }

    function resolveFull(string fullname, uint8 ptype)
        external view responsible override
        returns(address)
    {
        string st = fullname;
        uint l = st.byteLength();
        uint s = 0;
        address adr = address(this);
        for (uint i = 0; i < l; i++) {
            if (st.substr(i, 1) == "/") {
                adr = _resolve(st.substr(s, i - s), ptype, adr);
                s = i + 1;
            }
        }
        return adr;
    }

    function resolveSub(string name, address cert)
        external view override
        returns(address)
    {
        return _resolve(name, PlatformTypes.Certificate, cert);
    }

    function auction(string name)
        external view override
        returns(address)
    {
        return _resolve(name, PlatformTypes.Auction, address(this));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Cleanups

    function gc()
        external onlyOwnerCheck
    {
        require(Now() > last_gc + 600, Errors.GARBAGE_TOO_HOT);  // Not too often
        require(Now() > last_temp + 60, Errors.GARBAGE_TOO_HOT); // Something may be in progress
        tvm.accept();
        delete state_rx;
        delete temp_lookup;
        last_gc = Now();
        last_temp = Now();
        emit garbage_collected();
    }

    function gcNeeded()
        external view responsible
        returns(bool)
    {
        return (!state_rx.empty()) || (!temp_lookup.empty());
    }

    function gcPossibleAt()
        external view responsible
        returns(uint32)
    {
        return math.max(Now(), last_gc + 600, last_temp + 60);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Registration flow. This is surely some crazy ping pong.

    function RXHash(RegRequestX rx)
        pure private inline
        returns(uint128)
    {
        TvmBuilder b; b.store(rx); return uint128(tvm.hash(b.toCell()) % (2 ** 128));
    }

    // Entry point: regName -> Auction.inquiryRequest
    function regName(uint32 callbackFunctionId, RegRequest request)
        external override
    {
        require(msg.value >= DeNS.RegNameMinValue, Errors.VALUE_TOO_LOW);
        uint8 fail = 0;
        // Check duration
        if (request.duration < 1)
            fail = Errors.TOO_LOW_DURATION;
        if (request.duration > DeNS.MaxDurationValue)
            fail = Errors.TOO_HIGH_DURATION;
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
                if (resn.get() > Now())
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
        uint128 rhash = RXHash(reqx); state_rx[rhash] = reqx; last_temp = Now();
        address auct = _resolve(request.name, PlatformTypes.Auction, address(this));
        IDensAuction(auct).inquiryRequest{value: 0, bounce: true,
            flag: MsgFlag.MsgBalance, callback: DensRoot.auctionProcessCallback}(rhash, 0);
    }

    // regName -> Auction.inquiryRequest => auctionProcessCallback -> Auction.participateProxy
    function auctionProcessCallback(uint128 rhash, bool res, uint32 expiry)
        external override
    {
        RegRequestX reqx = state_rx[rhash];
        // Auction SC exists and returned some value
        require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        if (!res) {
            delete state_rx[rhash]; last_temp = Now();
            //                    uint32                   bool uint8                  address
            TvmBuilder b; b.store(reqx.callbackFunctionId, res, PlatformTypes.Auction, msg.sender);
            reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
            return;
        }
        RegPartReq rpr = RegPartReq(reqx.sender, reqx.r.duration, reqx.r.hash);
        IDensAuction(msg.sender).participateProxy{value: 0, bounce: true,
            flag: MsgFlag.MsgBalance, callback: DensRoot.auctionParticipationCallback}(rpr, rhash, expiry);
    }

    // regName -> Auction.inquiryRequest ~~> Certificate.inquiryExpiry => certificateProcessCallback
    function certificateProcessCallback(uint128 rhash, uint32 expiry)
        external override
    {
        RegRequestX reqx = state_rx[rhash];
        // delete state_rx[rhash]; vvv
        // Certificate SC exists and returned its expiry time
        require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Certificate, address(this)), Errors.INVALID_ADDRESS);
        if (expiry == 0) {
            DensPlatform(msg.sender).destroy();
        }
        if ((Now() >= expiry) || (expiry - Now() < DeNS.AuctionableTail)) {
            if (Now() < new_auctions_ban) {
                //                    uint32                   bool   uint8     address
                TvmBuilder b; b.store(reqx.callbackFunctionId, false, uint8(0), address(0));
                reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
                return;
            }
            initializeAuction(reqx, rhash, expiry);
            return;
        }
        delete state_rx[rhash]; last_temp = Now();
        //                    uint32                   bool   uint8                      address
        TvmBuilder b; b.store(reqx.callbackFunctionId, false, PlatformTypes.Certificate, msg.sender);
        reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
    }

    // regName -> Auction.inquiryRequest => auctionProcessCallback -> Auction.participateProxy => auctionParticipationCallback
    function auctionParticipationCallback(uint128 rhash, bool res)
        external override
    {
        RegRequestX reqx = state_rx[rhash];
        delete state_rx[rhash]; last_temp = Now();
        require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        //                    uint32                   bool uint8                  address
        TvmBuilder b; b.store(reqx.callbackFunctionId, res, PlatformTypes.Auction, msg.sender);
        reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
    }

    // regName -> Auction.inquiryRequest ~~> Certificate.inquiryExpiry => certificateProcessCallback -> initializeAuction
    // regName -> Auction.inquiryRequest ~~> Certificate.inquiryExpiry ~~> initializeAuction
    // ... initializeAuction -> Auction.inquiryRequest -> auctionProcessCallback (always exists flow)
    function initializeAuction(RegRequestX reqx, uint128 rhash, uint32 expiry)
        private
    {
        require(Now() >= new_auctions_ban, Errors.AUCTIONS_BANNED); // Must always pass because of preliminary checks, extra safeguard
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
        IDensAuction(address(p)).installBidCode{flag:MsgFlag.AddTranFees}(bid_code);
        // state_rx[rhash] = reqx;
        emit auctionDeployed(reqx.r.name, reqx.r.duration, reqx.sender, address(p));
        IDensAuction(address(p)).inquiryRequest{value: 0, bounce: true,
            flag: MsgFlag.MsgBalance, callback: DensRoot.auctionProcessCallback}(rhash, expiry);
    }

    // regName -> Auction.inquiryRequest ~~> BOUNCE
    // regName -> Auction.inquiryRequest ~~> Certificate.inquiryExpiry ~~> BOUNCE
    // Auction flow: auctionSucceeded -> Certificate.AuctionProcess ~~> BOUNCE
    onBounce(TvmSlice slice)
        external
    {
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
                // Certificate SC does not exist as well, we may start auction Now()
                require(msg.sender == _resolve(reqx.r.name, PlatformTypes.Certificate, address(this)), Errors.INVALID_ADDRESS);
                if (Now() < new_auctions_ban) {
                    //                    uint32                   bool   uint8     address
                    TvmBuilder b; b.store(reqx.callbackFunctionId, false, uint8(0), address(0));
                    reqx.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance, body: b.toCell()});
                    return;
                }
                initializeAuction(reqx, rhash, 0);
            }
        }
        if (functionId == tvm.functionId(IDensCertificate.auctionProcess)) {
            (uint32 callbackFunctionId) = slice.decode(uint32);
            if (callbackFunctionId == tvm.functionId(DensRoot.certAuctProcessCallback)) {
                TempData td = temp_lookup[msg.sender];
                delete temp_lookup[msg.sender]; last_temp = Now();
                require(msg.sender == _resolve(td.name, PlatformTypes.Certificate, address(this)), Errors.INVALID_ADDRESS);
                deployCertificate(td.name, td.winner, td.expiry, address(this));
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Auction flow

    function ensureExpiry(string name, uint32 expiry)
        external view override
    {
        require(msg.sender == _resolve(name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        require(expiry <= Now() + DeNS.MaxPeriodYears * (DeNS.BidPeriodPerYear + DeNS.RevealPeriodPerYear)
            + DeNS.ReAuctionGrace, Errors.VALUE_ERROR);
        address cert = _resolve(name, PlatformTypes.Certificate, address(this));
        IDensCertificate(cert).setExpiry{value: 0, bounce: true, flag: MsgFlag.MsgBalance}(expiry);
    }

    function auctionFailed(string name)
        external view override
    {
        require(msg.sender == _resolve(name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        emit auctionFail(name, msg.sender);
        IDensAuction(msg.sender).destroy{value: 0, bounce: true, flag: MsgFlag.MsgBalance}();
    }

    function auctionSucceeded(string name, address winner, uint32 expiry)
        external override
    {
        require(msg.sender == _resolve(name, PlatformTypes.Auction, address(this)), Errors.INVALID_ADDRESS);
        address cert = _resolve(name, PlatformTypes.Certificate, address(this));
        temp_lookup[cert] = TempData(name, winner, expiry); last_temp = Now();
        emit auctionSuccess(name, winner, expiry, msg.sender);
        IDensCertificate(cert).auctionProcess{callback: DensRoot.certAuctProcessCallback, value: 0.1 ton, flag: 1}(winner, expiry);
        IDensAuction(msg.sender).destroy{value: 0, bounce: true, flag: MsgFlag.MsgBalance}();
    }

    function auctionSink()
        external pure override
    {
        emit receivedAuction(msg.value);
    }

    function certAuctProcessCallback(bool)
        external override
    {
        delete temp_lookup[msg.sender]; last_temp = Now();
    }

    function certAuctProcessCallbackDummy(bool) external pure {}

    function deployCertificate(string name, address _owner, uint32 expiry, address parent)
        private
        returns(address)
    {
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
    function directlyDeploy(string name, address _owner, uint32 expiry)
        external override onlyOwner
        returns (address)
    {
        return deployCertificate(name, _owner, expiry, address(this));
    }

    // For playing with the contracts
    function directlyReconfigure(string /* name */, address /* _owner */, uint32 /* expiry */)
        virtual external override onlyOwner
        returns (address)
    {
        return address(0);
//        address p = _resolve(name, PlatformTypes.Certificate, address(this));
//        IDensCertificate(address(p)).auctionProcess{callback: DensRoot.certAuctProcessCallbackDummy, value: 0.1 ton, flag: 1}(_owner, expiry);
//        emit certificateReconfigured(name, _owner, expiry, address(p));
//        return p;
    }

    // Temporarily required until Debot is working. May be useful anyway.
    function generateHash(address bidder, uint128 amount, uint256 nonce)
        external override
        returns(uint256)
    {
        TvmBuilder b; b.store(bidder, amount, nonce);
        uint256 rhash = tvm.hash(b.toCell());
        return rhash;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-certificates

    function subCertRequest(string name, string subname, address _owner, uint32 expiry, address _par)
        external override
    {
        require(msg.sender == _resolve(name, PlatformTypes.Certificate, _par), Errors.INVALID_ADDRESS);
        address p = deployCertificate(subname, _owner, expiry, msg.sender);
        p.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance});
    }

    function subCertSync(string name, string subname, address _owner, uint32 expiry, address _par)
        external override
    {
        require(msg.sender == _resolve(name, PlatformTypes.Certificate, _par), Errors.INVALID_ADDRESS);
        address p = _resolve(subname, PlatformTypes.Certificate, msg.sender);
        IDensCertificate(address(p)).auctionProcess{callback: DensRoot.certAuctProcessCallbackDummy, value: 0.1 ton, flag: 1}(_owner, expiry);
        msg.sender.transfer({value: 0, bounce: false, flag: MsgFlag.MsgBalance});
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Owner

    function getOwner()
        external view responsible override
        returns(uint256)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} owner;
    }

    function transferOwner(uint256 new_owner)
        external override onlyOwner
    {
        emit prepareOwnerTransfer(new_owner);
        pending_owner = new_owner;
    }

    function acceptOwner()
        external override
    {
        require(msg.pubkey() == pending_owner, Errors.NOT_PENDING_OWNER);
        tvm.accept();
        emit ownerTransferred(owner, pending_owner);
        owner = pending_owner; pending_owner = 0;
    }

    function getPendingOwner()
        external view responsible override
        returns(uint256)
    {
        return {value: 0, bounce: true, flag: MsgFlag.MsgBalance} pending_owner;
    }

    modifier onlyOwnerCheck()
    {
        require(msg.pubkey() == owner, Errors.NOT_MY_OWNER);
        _;
    }

    modifier onlyOwner()
    {
        require(msg.pubkey() == owner, Errors.NOT_MY_OWNER);
        tvm.accept();
        _;
    }

    modifier onlySmvRoot()
    {
        require(msg.sender == smv_root, Errors.INVALID_ADDRESS);
        tvm.accept();
        _;
    }

    function withdraw(address dest, uint128 value)
        external pure onlyOwner
    {
        require(address(this).balance - value >= DeNS.KeepAtRoot, Errors.REMAIN_TOO_LOW);
        emit withdrawn(dest, value);
        dest.transfer(value, true);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Events

    event platformCodeUpdated(uint256 hash);
    event certificateCodeUpdated(uint256 hash);
    event auctionCodeUpdated(uint256 hash);
    event rootCodeUpdated(uint256 hash);

    event bidCodeUpdated(uint256 hash);

    event balanceAdded(address donor, uint128 value);
    event certCodeUpgraded(address cert);

    event prepareOwnerTransfer(uint256 to);
    event ownerTransferred(uint256 from, uint256 to);
    event ownerChanged(uint256 to);
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
    event newAuctionsBanned(uint32 until);
    event smvRootSet(address smv_root);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Now() for IT

    function Now() pure virtual internal inline returns (uint32) { return now; }

}