pragma ton-solidity ^0.38.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "./interfaces/ICertUpgrader.sol";
import "./interfaces/ISink.sol";
import "./interfaces/IUpgradable.sol";

contract DensRoot is ICertUpgrader, ISink {

    //------------------------------------------------------------------------------------------------------------------
    // Persistent variables

    // ---------------------------------------
    // Code images for deployment and upgrades
    TvmCell public platform_code;
    TvmCell public certificate_code;
    TvmCell public auction_code;

    // -----------------
    // Owner public keys
    uint256 public owner;
    uint256 public pending_owner;

    //------------------------------------------------------------------------------------------------------------------
    // Temporary variables


    //------------------------------------------------------------------------------------------------------------------
    // Constructor

    constructor()
        public
    {
        require(tvm.pubkey() != 0, Errors.NO_OWNER_SET);
        require(msg.pubkey() == tvm.pubkey(), Errors.NOT_MY_OWNER);
        tvm.accept();
        owner = msg.pubkey();
    }

    //------------------------------------------------------------------------------------------------------------------
    // Modifiers

    modifier onlyOwner() {
        require(msg.pubkey() == owner, Errors.NOT_MY_OWNER);
        tvm.accept();
        _;
    }

    //------------------------------------------------------------------------------------------------------------------
    // Safeguard against accidental fund transfers

    receive() external pure { revert(); }
    fallback() external pure { revert(); }

    // Special function to accept funds (user or technical)
    function sink() external pure override {}

    //------------------------------------------------------------------------------------------------------------------
    // Install / upgrade code images

    event platformCodeUpdated(uint256 hash); // ************************************************************************

    function installPlatform(TvmCell code)
        external override onlyOwner
    {
        platform_code = code;
        emit platformCodeUpdated(tvm.hash(code));
    }

    event certificateCodeUpdated(uint256 hash); // *********************************************************************

    function installCertificate(TvmCell code)
        external override onlyOwner
    {
        certificate_code = code;
        emit certificateCodeUpdated(tvm.hash(code));
    }

    event auctionCodeUpdated(uint256 hash); // *************************************************************************

    function installAuction(TvmCell code)
        external override onlyOwner
    {
        auction_code = code;
        emit auctionCodeUpdated(tvm.hash(code));
    }

    //------------------------------------------------------------------------------------------------------------------
    // Install code upgrade

    event certCodeUpgraded(address cert); // ***************************************************************************

    function upgrade(TvmCell code)
        external override onlyOwner
    {
        TvmBuilder b;
        b.store(platform_code, certificate_code, auction_code, owner, pending_owner);
        emit rootCodeUpdated(tvm.hash(code));
        tvm.setcode(code);
        tvm.setCurrentCode(code);
        onCodeUpgrade(b.toCell());
    }

    function onCodeUpgrade(TvmCell data) private {} // Special!

    //------------------------------------------------------------------------------------------------------------------
    // Handle upgrade requests from certificates

    function requestCertificateUpgrade()
        external override
    {
        emit certCodeUpgraded(msg.sender);
        IUpgradable(msg.sender).upgrade{value: 0, bounce: false, flag: MsgFlag.MsgBalance}(certificate_code);
    }

    //------------------------------------------------------------------------------------------------------------------
    // Reserved names and manual operation

    function directlyDeploy(string name, address _owner, uint32 expiry)
        external override onlyOwner
        returns (address)
    {
        return deployCertificate(name, _owner, expiry, address(this));
    }

    function directlyReconfigure(string name, address _owner, uint32 expiry)
        external override onlyOwner
        returns (address)
    {
        address p = _resolve(name, PlatformTypes.Certificate, address(this));
        IDensCertificate(address(p)).auctionProcess{callback: DensRoot.certAuctProcessCallbackDummy, value: 0.1 ton, flag: 1}(_owner, expiry);
        emit certificateReconfigured(name, _owner, expiry, address(p));
        return p;
    }

    function reserveName(string name, uint32 until)
        external override onlyOwner
    {
        if (until == 1) until = 0xFFFFFFFF; // permanent
        emit nameReserved(name, until);
        if (until < now) {
            delete reserved[name];
        } else
            reserved[name] = until;
    }

    //------------------------------------------------------------------------------------------------------------------
    // Generate bid hash for auction

    function generateHash(uint128 amount, uint256 nonce) external override returns(uint256) {
        TvmBuilder b; b.store(amount, nonce);
        uint256 rhash = tvm.hash(b.toCell());
        return rhash;
    }




}