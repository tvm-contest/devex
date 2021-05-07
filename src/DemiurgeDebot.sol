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
import "./interfaces/AmountInput.sol";
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

    struct Padawan {
        uint32 reqVotes;
        uint32 totalVotes;
        uint32 lockedVotes;
    }
    
    address _demiurge;
    address _mtsg;
    address _padawan;
    uint _padawanPubkey;

    uint32 _retryId;

    mapping (uint32 => ProposalData) _data;
    mapping (uint32 => ProposalInfo) _info;
    mapping(address => uint32) _activeProposals;
    NewProposal _newprop;
    //SetCodeProposalSpecific _newSetCode;
    ReserveProposalSpecific _newReserve;
    SetOwnerProposalSpecific _newSetOwner;
    SetRootOwnerProposalSpecific _newSetRootOwner;

    Padawan _padawanVotes;
    mapping (address => TipAccount) _tip3Accounts;
    uint128 _tmpTokenBalance;
    uint8 _tmpTokenDecimals;

    uint128 _fromBalance;
    address _fromTip3Addr;
    uint64 _depositAmount;
    uint32 _proposalId;
    uint32 _votes;
    bool _yesNo;

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
        version = "1.8.0";
        publisher = "RSquad";
        key = "Voting system for DENS.";
        author = "RSquad";
        support = address.makeAddrStd(0, 0x0);
        hello = "Hello, i am SMV Demiurge Debot.";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, ConfirmInput.ID ];
    }

    function start() public override {
        //Sdk.getBalance(tvm.functionId(setDemiBalance), _demiurge);
        _getProposals();
        _getPadawan();
    }

    function mainMenu() public {
        Terminal.print(0, format("Demiurge: {}", _demiurge));
        Terminal.print(0, format("Multisig: {}", _mtsg));
        if (_padawan != address(0)) {
            Terminal.print(0, format("Padawan: {}", _padawan));
            Terminal.print(0, 
            format("Your votes:\ntotal: {}, locked: {}, requested to reclaim: {}",
                _padawanVotes.totalVotes,
                _padawanVotes.lockedVotes,
                _padawanVotes.reqVotes
            ));
            if (!_tip3Accounts.empty()) {
                //(address root, TipAccount tip3wallet) = _tip3Accounts.min().get();
                //Terminal.print(0, format("[DEBUG] TIP3 Root: {}", root));
                //Terminal.print(0, format("[DEBUG] TIP3 Wallet: {}", tip3wallet.addr));
                Terminal.print(0, format("TIP3 deposit: {} tokens", _tmpTokenBalance));
            }
        } else {
            Terminal.print(0, "You need to attach your personal voting contract (Padawan) or deploy new one.");
        }

        MenuItem[] items;
        items.push(MenuItem("Attach Multisig", "", tvm.functionId(askMultisig)));
        if (_padawan == address(0)) {
            items.push(MenuItem("Attach Padawan", "", tvm.functionId(attachPadawanMenu)));
        }
        items.push(MenuItem("View Proposals", "", tvm.functionId(viewAllProposals)));
        items.push(MenuItem("Create Proposal", "", tvm.functionId(createProposal)));
        items.push(MenuItem("Vote for Proposal", "", tvm.functionId(voteForProposal)));
        if (_padawan != address(0)) {
            items.push(MenuItem("Acquire votes", "", tvm.functionId(depositTokens)));
        }
        if (_padawanVotes.totalVotes != 0) {
            items.push(MenuItem("Reclaim votes", "", tvm.functionId(reclaimVotes)));
        }
        Menu.select("What do you want to do?", "", items);
    }

    //
    // Reclaim votes
    //
    function reclaimVotes(uint32 index) public {
        index = index;
        NumberInput.get(tvm.functionId(enterVotes), "Enter number of votes:", 1, _padawanVotes.totalVotes);
        ConfirmInput.get(tvm.functionId(reclaim) , "Sign and reclaim?");
    }

    function reclaim(bool value) public {
        if (!value) {
            return;
        }
        _retryId = tvm.functionId(reclaim);
        optional(uint256) none = 0;
        TvmCell payload = tvm.encodeBody(IPadawan.reclaimDeposit, _votes);
        IMultisig(_mtsg).submitTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(onSuccess),
            onErrorId: tvm.functionId(onError)
        }(_padawan, 1.5 ton, true, false, payload);
    }

    //
    // Deposit tip3 tokens 
    //

    function depositTokens(uint32 index) public {
        index;
        Terminal.print(0, "To acquire votes you need to deposit tip3 tokens first. Then tokens will be locked and converted to votes.");
        AddressInput.get(tvm.functionId(setFromTip3Wallet), "Enter tip3 wallet address from which you want to deposit tokens:");
    }

    function setFromTip3Wallet(address value) public {
        _fromTip3Addr = value;
        optional(uint256) none;
        ITokenWallet(value).getBalance{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(setFromBalance),
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: none
        }();
    }

    function setFromBalance(uint128 value0) public {
        _fromBalance = value0;
        AmountInput.get(tvm.functionId(setDepositAmount), "How many tokens to deposit?", _tmpTokenDecimals, 0, _fromBalance);
        Terminal.print(tvm.functionId(transferTokens), "Ok, sign message with tip3 wallet keys.");
    }

    function setDepositAmount(uint128 value) public {
        _depositAmount = uint64(value);
    }

    function transferTokens() public {
        _retryId = 0;
        optional(uint256) pubkey = 0;
        (, TipAccount acc) = _tip3Accounts.min().get();
        ITokenWallet(_fromTip3Addr).transfer{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: tvm.functionId(depositTokens2),
            onErrorId: tvm.functionId(onError),
            time: uint32(now),
            expire: 0,
            pubkey: pubkey
        }(acc.addr, _depositAmount, 0.5 ton);
    }

    //
    // Lock votes
    //

    function depositTokens2() public {
        Terminal.print(0, "Transfer succeeded. Now i will convert them to votes.");
        Terminal.print(tvm.functionId(depositTokens3), "Sign next message with multisig keys.");
    }

    function depositTokens3() public {
        _retryId = tvm.functionId(depositTokens4);
        depositTokens4(true);
    }

    function depositTokens4(bool value) public {
        if (!value) {
            start();
            return;
        }
        (address root, ) = _tip3Accounts.min().get();
        optional(uint256) none = 0;
        TvmCell payload = tvm.encodeBody(IPadawan.depositTokens, _fromTip3Addr, root.value, _depositAmount);
        IMultisig(_mtsg).submitTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(onSuccess),
            onErrorId: tvm.functionId(onError)
        }(_padawan, 1.5 ton, true, false, payload);
    }

    function setTip3Wallet(address value) private pure {
        optional(uint256) none;
        ITokenWallet(value).getBalance{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(setTokenBalance),
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: none
        }();
        ITokenWallet(value).getDecimals{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(setTokenDecimals),
            onErrorId: 0,
            time: uint32(now),
            expire: 0,
            pubkey: none
        }();
    }

    function setTokenBalance(uint128 value0) public {
        _tmpTokenBalance = value0;
    }

    function setTokenDecimals(uint8 value0) public {
        _tmpTokenDecimals = value0;
    }

    //---------------------------------------------------------------

    function askMultisig(uint32 index) public {
        index;
        AddressInput.get(tvm.functionId(saveMultisig), "Type Multisig address");
    }
    function saveMultisig(address value) public {
        _mtsg = value;
        start();
    }

    function voteForProposal(uint32 index) public {
        index;
        if(_padawan != address(0)) {
            Terminal.print(0, format("[DEBUG] Current Padawan: {}", _padawan));
            Terminal.print(0, format("[DEBUG] Votes: {} reqVotes, {} totalVotes, {} lockedVotes",
                _padawanVotes.reqVotes,
                _padawanVotes.totalVotes,
                _padawanVotes.lockedVotes
            ));
            if (_padawanVotes.totalVotes == 0) {
                Terminal.print(tvm.functionId(Debot.start), "You don't have votes.");
                return;
            }
            this.voteForProposal2();
        } else {
            attachPadawanMenu(0);
        }
    }

    function attachPadawanMenu(uint32 index) public {
        index;
        Terminal.print(0, "Padawan doesn't attached");
        Menu.select("What do you want to do?", "", [
            MenuItem("Attach existed Padawan", "", tvm.functionId(attachPadawan)),
            MenuItem("Create Padawan", "", tvm.functionId(createPadawan))
        ]);
    }

    function voteForProposal2() public {
        int count = 0;
        for((uint32 id, ) : _data) {
            count++;
            id;
        }
        if (count == 0) {
            Terminal.print(tvm.functionId(Debot.start), "There is no active proposals.");
        } else {
            NumberInput.get(tvm.functionId(enterProposalId), "Enter proposal id:", 0, count - 1);
        }
    }

    function enterProposalId(int256 value) public {
        _proposalId = uint32(value);
        ProposalData proposal = _data[_proposalId];
        if (proposal.state >= ProposalState.Ended) {
            Terminal.print(tvm.functionId(Debot.start), "Proposal is expired.");
            return;
        } else {
            NumberInput.get(tvm.functionId(enterVotes), "Enter number of votes:", 0, _padawanVotes.totalVotes - _padawanVotes.lockedVotes);
            Menu.select("How to vote?", "", [
                MenuItem("Vote \"Yes\"", "", tvm.functionId(sendVoteFor)),
                MenuItem("Vote \"No\"", "", tvm.functionId(sendVoteFor))
            ]);
        }
    }

    function enterVotes(int256 value) public {
        _votes = uint32(value);
    }

    function sendVoteFor(uint32 index) public {
        _yesNo = index == 0;
        ConfirmInput.get(tvm.functionId(retryVoteFor), "Sign and send votes?");
    }

    function retryVoteFor(bool value) public {
        if (!value) {
            return;
        }
        _retryId = tvm.functionId(retryVoteFor);
        address propAddr = _data[_proposalId].addr;
        optional(uint256) none = 0;
        TvmCell payload = tvm.encodeBody(IPadawan.voteFor, propAddr, _yesNo, _votes);
        IMultisig(_mtsg).submitTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(onSuccess),
            onErrorId: tvm.functionId(onError)
        }(_padawan, 1.5 ton, true, false, payload);
    }

    // --------------------------------------------------

    function attachPadawan(uint32 index) public {
        index;
        Terminal.input(tvm.functionId(enterNewPadawanPubkey), "Enter pubkey:", false);
        this.start();
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
        }(_demiurge, 5 ton, false, false, m_payload);
    }

    function createProposal(uint32 index) public {
        index = index;
        if(_mtsg == address(0)) {
            Terminal.print(tvm.functionId(Debot.start), "You need to attach multisig first");
        } else {
            NumberInput.get(tvm.functionId(enterStart), "Enter unixtime when voting for proposal should start:", uint32(now) + 60, 0xFFFFFFFF);
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
    }

    function _printProposals() private inline {
        for((uint32 id, ) : _data) {
            this.printProp(id);
        }
        Terminal.print(tvm.functionId(Debot.start), "Back to start");
    }

    function printProp(uint32 id) public {
        ProposalInfo info = _info[id];
        ProposalData data = _data[id];

        string opt = "\"soft majority\"";

        string fmt = format(
            "\nID {}. \"{}\"\nStatus: {}\nType: {}\nStart: {}, End: {}\nTotal votes: 21000000, options: {}\nAddress: {}\ncreator: {}",
            id, info.title, _stateToString(data.state), _typeToString(info.proposalType), info.start, info.end,
            opt, data.addr, data.ownerAddress
        );
        Terminal.print(0, fmt);

        IProposal(data.addr).getCurrentVotes{
            abiVer: 2,
            extMsg: true,
            sign: false,
            time: 0,
            callbackId: tvm.functionId(setProposalVotes),
            onErrorId: 0
        }();
    }

    function setProposalVotes(uint32 votesFor, uint32 votesAgainst) public {
        Terminal.print(0, format("\"Yes\" votes: {}, \"No\" votes: {}", votesFor, votesAgainst));
    }

    function _typeToString(ProposalType proposalType) inline private pure returns (string) {
        if (proposalType == ProposalType.SetCode) {
            return "SetCode";
        }
        if (proposalType == ProposalType.Reserve) {
            return "Reserve";
        }
        if (proposalType == ProposalType.SetOwner) {
            return "SetOwner";
        }
        if (proposalType == ProposalType.SetRootOwner) {
            return "SetRootOwner";
        }
        return "unknown";
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

    function setProposalData(mapping(uint32 => ProposalData) proposals) public {
        _data = proposals;
    }
    function setProposalInfo(mapping(uint32 => ProposalInfo) proposals) public {
        _info = proposals;
    }
    function setPadawan(PadawanData padawanData) public {
        _padawan = padawanData.addr;
        if(_padawan != address(0)) {
            IPadawan(_padawan).getVoteInfo{
                abiVer: 2,
                extMsg: true,
                sign: false,
                callbackId: tvm.functionId(setPadawanVotes),
                onErrorId: tvm.functionId(onError),
                time: uint32(now)
            }();
            IPadawan(_padawan).getTokenAccounts{
                abiVer: 2,
                extMsg: true,
                sign: false,
                callbackId: tvm.functionId(setTokenAccounts),
                onErrorId: 0,
                time: uint32(now)
            }();
        } else {
            this.mainMenu();
        }
    }
    function setPadawanVotes(uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) public {
        _padawanVotes = Padawan(reqVotes, totalVotes, lockedVotes);
    }

    function setTokenAccounts(mapping (address => TipAccount) allAccounts) public {
        _tip3Accounts = allAccounts;
        if (!_tip3Accounts.empty()) {
            (, TipAccount acc) = _tip3Accounts.min().get();
            setTip3Wallet(acc.addr);
        }
        this.mainMenu();
    }

    function setDemiBalance(uint128 nanotokens) public {
        //Terminal.print(0, format("Demiurge balance: {} nanotokens", nanotokens));
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

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Failed. Sdk error {}. Exit code {}.", sdkError, exitCode));
        ConfirmInput.get(_retryId, "Do you want to retry?");
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
        // _pub = ;
        // _sec = ;
    }
}