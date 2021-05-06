pragma ton-solidity >=0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "./interfaces/Debot.sol";
import "./interfaces/Terminal.sol";
import "./interfaces/Menu.sol";
import "./interfaces/Msg.sol";
import "./interfaces/ConfirmInput.sol";
import "./interfaces/AddressInput.sol";
import "./interfaces/NumberInput.sol";
import "./interfaces/Sdk.sol";
import "./interfaces/Upgradable.sol";
import "./interfaces/IDemiurge.sol";
//import "VotingDebot.sol";
import "VotingDebotStub.sol";
import "DemiurgeStore.sol";


import "./interfaces/ITokenWallet.sol";
import "./DemiurgeStore.sol";
import "./Base.sol";
import "./Padawan.sol";
import "./interfaces/IBaseData.sol";
import "./interfaces/IDemiurge.sol";
import "./interfaces/IPadawan.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IInfoCenter.sol";

interface IMultisig {
    function submitTransaction(
        address  dest,
        uint128 value,
        bool bounce,
        bool allBalance,
        TvmCell payload)
    external returns (uint64 transId);
}

contract DemiurgeDebot is IBaseData, DemiurgeStore, Debot, Upgradable {

    // Debot context ids
    uint8 constant STATE_DEPLOY_VOTING_DEBOT_0 = 1;
    uint8 constant STATE_DEPLOY_VOTING_DEBOT_1 = 2;
    uint8 constant STATE_DEPLOY_VOTING_DEBOT_2 = 3;
    uint8 constant STATE_DEPLOY_VOTING_DEBOT_3 = 4;
    uint8 constant STATE_DEPLOY_VOTING_DEBOT_4 = 5;
    uint8 constant STATE_DEPLOY_DEMIURGE       = 6;
    uint8 constant STATE_TRANSFER              = 7;
    uint8 constant STATE_SET_DEMI              = 8;
    uint8 constant STATE_SUCCEEDED             = 9;

    uint128 constant MIN_DEBOT_BALANCE = 1 ton;
    /*
        Storage
    */

    struct NewProposal {
        uint32 id;
        uint32 start;
        uint32 end;
        string title;
        ProposalType proposalType;
    }
    
    address _demiurge;
    address _mtsg;
    address _padawan;
    uint _padawanPubkey;
    uint128 _balance;

    uint32 _retryId;

    mapping (uint32 => ProposalData) _data;
    mapping (uint32 => ProposalInfo) _info;
    mapping(address => uint32) _activeProposals;
    NewProposal _newprop;
    SetCodeProposalSpecific _newSetCode;
    ReserveProposalSpecific _newReserve;
    SetOwnerProposalSpecific _newSetOwner;
    SetRootOwnerProposalSpecific _newSetRootOwner;

    modifier accept {
        tvm.accept();
        _;
    }

    /*
     *   Init functions
     */

    constructor(address demiurge) public accept {
        tvm.accept();
        _demiurge = demiurge;
    }

    function setDemiurgeAddress(address addr) public signed {
        _demiurge = addr;
    }

    function getDemiurge() public view returns (address addr) {
        return _demiurge;
    }

    /*
     *  Overrided Debot functions
     */

    /// @notice Returns Metadata about DeBot.
    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name, string version, string publisher, string key, string author,
        address support, string hello, string language, string dabi, bytes icon
    ) {
        name = "Demiurge Debot";
        version = "1.6.0";
        publisher = "RSquad";
        key = "Deploy SMV system and create personal voting debot.";
        author = "RSquad";
        support = address.makeAddrStd(0, 0x0);
        hello = "Hello, i am Demiurge Debot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, ConfirmInput.ID ];
    }

    function start () public override {
        _getProposals();
        if(_padawanPubkey != 0) {
            _getPadawan();
        }
        Sdk.getBalance(tvm.functionId(setDemiBalance), _demiurge);
        Terminal.print(0, "Demiurge Debot.");
        Terminal.print(0, format("Current Demiurge: {}", _demiurge));
        Terminal.print(0, format("Current Multisig address: {}", _mtsg));
        if(_padawan != address(0)) {
            Terminal.print(0, format("Current Padawan: {}", _padawan));
        }
        Menu.select("What do you want to do?", "", [
            MenuItem("Attach Multisig", "", tvm.functionId(askMultisig)),
            MenuItem("View Proposals", "", tvm.functionId(viewAllProposals)),
            MenuItem("Create Proposal", "", tvm.functionId(createProposal)),
            MenuItem("Vote for Proposal", "", tvm.functionId(voteForProposal))
        ]);
    }

    function askMultisig(uint32 index) public {
        index;
        AddressInput.get(tvm.functionId(saveMultisig), "Type Multisig address");
    }
    function saveMultisig(address value) public {
        _mtsg = value;
        Terminal.print(tvm.functionId(Debot.start), format("Multisig address: {}", value));
    }

    function voteForProposal(uint32 index) public {
        index;
        if(_padawan != address(0)) {
            Terminal.print(0, format("Current Padawan: {}", _padawan));
        } else {
            Terminal.print(0, "Padawan doesn't attached");
            Menu.select("What do you want to do?", "", [
                MenuItem("Attach existed Padawan", "", tvm.functionId(attachPadawan)),
                MenuItem("Create Padawan", "", tvm.functionId(createPadawan))
            ]);
        }
    }

    function attachPadawan(uint32 index) public {
        index;
        Terminal.input(tvm.functionId(enterNewPadawanPubkey), "Enter pubkey:", false);
    }

    function createPadawan(uint32 index) public {
        index;
        if(_mtsg == address(0)) {
            Terminal.print(tvm.functionId(Debot.start), "You need to attach multisig first");
        } else {
            Terminal.input(tvm.functionId(enterNewPadawanPubkey), "Enter pubkey:", false);
            this.createPadawan2();
        }
    }
    function createPadawan2() public view {
        TvmCell m_payload = tvm.encodeBody(IDemiurge.deployPadawan, _padawanPubkey);
        optional(uint256) none;
        IMultisig(_mtsg).submitTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(onSuccess),
            onErrorId: tvm.functionId(onError)
        }(_demiurge, 3 ton, false, false, m_payload);
    }

    function createProposal(uint32 index) public {
        index = index;
        if(_mtsg == address(0)) {
            Terminal.print(tvm.functionId(Debot.start), "You need to attach multisig first");
        } else {
            NumberInput.get(tvm.functionId(enterStart), "Enter unixtime when voting for proposal should start:", uint32(now), 0xFFFFFFFF);
            NumberInput.get(tvm.functionId(enterEnd), "Enter duration of voting period for contest proposal (in seconds):", 60 * 60 * 24 * 7, 31536000);
            Terminal.input(tvm.functionId(enterProposalTitle), "Enter title:", false);
            Menu.select("Select Proposal Type", "", [
                MenuItem("SetCode", "", tvm.functionId(enterSetCode)),
                MenuItem("Reserve", "", tvm.functionId(enterReserve)),
                MenuItem("SetOwner", "", tvm.functionId(enterSetOwner)),
                MenuItem("SetRootOwner", "", tvm.functionId(enterSetRootOwner))
            ]);
            this.createProposal2();
        }
    }

    function createProposal2() public {
        if(_newprop.proposalType == ProposalType.SetCode) {
            // NumberInput.get(tvm.functionId(enterSetCodeType), "Enter contract proposalType:", 0, 255);
            // Terminal.input(tvm.functionId(enterSetCodeCode), "Enter code:", false);
            Terminal.print(tvm.functionId(Debot.start), "DeBot doesn't support SetCode Proposals");
        } else if(_newprop.proposalType == ProposalType.Reserve) {
            Terminal.input(tvm.functionId(enterReserveName), "Enter name:", false);
            NumberInput.get(tvm.functionId(enterReserveTs), "Enter unixtime:", uint32(now), 0xFFFFFFFF);
        } else if(_newprop.proposalType == ProposalType.SetOwner) {
            Terminal.input(tvm.functionId(enterSetOwnerName), "Enter name:", false);
            AddressInput.get(tvm.functionId(enterSetOwnerOwner), "Enter owner:");
            NumberInput.get(tvm.functionId(enterSetOwnerTs), "Enter unixtime:", uint32(now), 0xFFFFFFFF);
        } else if(_newprop.proposalType == ProposalType.SetRootOwner) {
            Terminal.input(tvm.functionId(enterSetRootOwnerPubkey), "Enter pubkey:", false);
            Terminal.input(tvm.functionId(enterSetRootOwnerComment), "Enter comment:", false);
        }
        this.createProposal3();
    }

    function createProposal3() public view {
        if(_newprop.proposalType == ProposalType.Reserve) {
            TvmCell m_payload = tvm.encodeBody(IDemiurge.deployReserveProposal, _newprop.start, _newprop.end, _newprop.title, _newReserve);
            optional(uint256) none;
            IMultisig(_mtsg).submitTransaction{
                abiVer: 2,
                extMsg: true,
                sign: true,
                pubkey: none,
                time: uint64(now),
                expire: 0,
                callbackId: tvm.functionId(onSuccess),
                onErrorId: tvm.functionId(onError)
            }(_demiurge, 3 ton, false, false, m_payload);
        } else if(_newprop.proposalType == ProposalType.SetOwner) {
            TvmCell m_payload = tvm.encodeBody(IDemiurge.deploySetOwnerProposal, _newprop.start, _newprop.end, _newprop.title, _newSetOwner);
            optional(uint256) none;
            IMultisig(_mtsg).submitTransaction{
                abiVer: 2,
                extMsg: true,
                sign: true,
                pubkey: none,
                time: uint64(now),
                expire: 0,
                callbackId: tvm.functionId(onSuccess),
                onErrorId: tvm.functionId(onError)
            }(_demiurge, 3 ton, false, false, m_payload);
        } else if(_newprop.proposalType == ProposalType.SetRootOwner) {
            TvmCell m_payload = tvm.encodeBody(IDemiurge.deploySetRootOwnerProposal, _newprop.start, _newprop.end, _newprop.title, _newSetRootOwner);
            optional(uint256) none;
            IMultisig(_mtsg).submitTransaction{
                abiVer: 2,
                extMsg: true,
                sign: true,
                pubkey: none,
                time: uint64(now),
                expire: 0,
                callbackId: tvm.functionId(onSuccess),
                onErrorId: tvm.functionId(onError)
            }(_demiurge, 3 ton, false, false, m_payload);
        }
    }

    function onSuccess(uint64 transId) public {
        Terminal.print(tvm.functionId(Debot.start), format("Transaction succeeded. txId={}", transId));
    }

    function enterNewPadawanPubkey(string value) public {
        (_padawanPubkey, ) = stoi("0x" + value);
    }

    function enterStart(int256 value) public {
        _newprop.start = uint32(value);
    }
    function enterEnd(int256 value) public {
        _newprop.end = uint32(int256(_newprop.start) + value);
    }
    function enterProposalTitle(string value) public {
        _newprop.title = value;
    }
    
    function enterSetCode(uint32 index) public {
        index;
        _newprop.proposalType = ProposalType.SetCode;
    }
    function enterReserve(uint32 index) public {
        index;
        _newprop.proposalType = ProposalType.Reserve;
    }
    function enterSetOwner(uint32 index) public {
        index;
        _newprop.proposalType = ProposalType.SetOwner;
    }
    function enterSetRootOwner(uint32 index) public {
        index;
        _newprop.proposalType = ProposalType.SetRootOwner;
    }

    function enterReserveName(string value) public {
        _newReserve.name = value;
    }
    function enterReserveTs(int256 value) public {
        _newReserve.ts = uint32(value);
    }

    function enterSetOwnerName(string value) public {
        _newSetOwner.name = value;
    }
    function enterSetOwnerOwner(address value) public {
        _newSetOwner.owner = value;
    }
    function enterSetOwnerTs(int256 value) public {
        _newReserve.ts = uint32(value);
    }

    function enterSetRootOwnerPubkey(string value) public {
        (_newSetRootOwner.pubkey, ) = stoi("0x" + value);
    }
    function enterSetRootOwnerComment(string value) public {
        _newSetRootOwner.comment = value;
    }

    function viewAllProposals(uint32 index) public {
        index = index;
        Terminal.print(0, "List of proposals:");
        _printProposals();
        Terminal.print(tvm.functionId(Debot.start), "Back to start");
    }

    function _printProposals() private inline {
        for((uint32 id, ) : _data) {
            _printProp(id);
        }
    }

    function _printProp(uint32 id) private inline {
        ProposalInfo info = _info[id];
        ProposalData data = _data[id];
        string opt = "\"soft majority\"";

        string fmt = format(
            "\nID {}. \"{}\"\nStatus: {}\nStart: {}, End: {}\nTotal votes: 21000000, options: {}\nAddress: {}\ncreator: {}\n",
            id, info.title, _stateToString(data.state), info.start, info.end,
            opt, data.addr, data.ownerAddress
        );
        Terminal.print(0, fmt);
    }

    function _stateToString(ProposalState state) inline private pure returns (string) {
        if (state <= ProposalState.New) {
            return "New";
        }
        if (state == ProposalState.OnVoting) {
            return "Voting";
        }
        if (state == ProposalState.Ended) {
            return "Ended";
        }
        if (state == ProposalState.Passed) {
            return "Passed";
        }
        if (state == ProposalState.Failed) {
            return "Failed";
        }
        if (state == ProposalState.Finalized) {
            return "Finalized";
        }
        if (state == ProposalState.Distributed) {
            return "Distributed";
        }
        return "unknown";
    }

    function _printActiveProposals() private {
        if (_activeProposals.empty()) {
            Terminal.print(0, "No active proposals");
            return;
        }
        for ((address addr, uint32 votes) : _activeProposals) {
            uint32 id = _findProposal(addr);
            _printProp(id);
            Terminal.print(0, format("You sent {} votes for it.", votes));
        }
    }

    function _findProposal(address findAddr) private view returns (uint32) {
        optional(uint32, ProposalData) prop = _data.min();
        while (prop.hasValue()) {
            (uint32 id, ProposalData pd) = prop.get();
            if (pd.addr == findAddr) {
                return id;
            }
            prop = _data.next(id);
        }
        return 0;
    }

    function _getProposals() private view {
        IDemiurge(_demiurge).getProposalData{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(setProposalData),
            onErrorId: 0,
            time: uint32(now)
        }();
        IDemiurge(_demiurge).getProposalInfo{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(setProposalInfo),
            onErrorId: 0,
            time: uint32(now)
        }();
    }

    function _getPadawan() private view {
        IDemiurge(_demiurge).getPadawan{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(setPadawan),
            onErrorId: tvm.functionId(onError),
            time: uint32(now)
        }(_padawanPubkey);
    }

    // function setTokenAccounts(mapping (address => TipAccount) allAccounts) public {
    //     _tip3Accounts = allAccounts;
    // }

    function setProposalData(mapping(uint32 => ProposalData) proposals) public {
        _data = proposals;
    }

    function setProposalInfo(mapping(uint32 => ProposalInfo) proposals) public {
        _info = proposals;
    }
    function setPadawan(ProposalData proposalData) public {
        _padawan = proposalData.addr;
    }

    function setDemiBalance(uint128 nanotokens) public {
        _balance = nanotokens;
        Terminal.print(0, format("Demiurge balance: {} nanotokens", nanotokens));
    }

    function onSuccessfulDeploy() public pure {
        optional(uint256) none;
        this.getDemiurge{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(updateDemi),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false,
            pubkey: none
        }();
    }

    function updateDemi(address addr) public {
        _demiurge = addr;
        Terminal.print(tvm.functionId(Debot.start), "Deploy succeeded.");
    }

    function onSuccessfulSet() public {
        Terminal.print(tvm.functionId(Debot.start), "Succeeded.");
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Failed. Sdk error {}. Exit code {}.", sdkError, exitCode));
        ConfirmInput.get(_retryId, "Do you want to retry?");
    }

    function retrySetAddress(bool value) public pure {
        if (!value) return;
        // setDemiAddress(_demiurge);
    }

    /*
     *  Helpers
     */

    function tokens(uint128 nanotokens) private pure returns (uint64, uint64) {
        uint64 decimal = uint64(nanotokens / 1e9);
        uint64 float = uint64(nanotokens - (decimal * 1e9));
        return (decimal, float);
    }

    function onCodeUpgrade() internal override {
        tvm.resetStorage();
        // _pub = 0x042ba05fab575ae9488b5a4b49b293f07b885cad09a21292aaaa3c26ebba1c66;
        // _sec = 0x14de59851748d1df1c986de13c4e6d52291e6b832524f67278935578f0b58305;
        // priceProvider = address.makeAddrStd(0, 0x9e9f912a67088341a9cd04330c40eff63300c52bf2fb4634e286a6d0d1e9a77c);
    }
}
