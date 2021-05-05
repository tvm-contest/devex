pragma ton-solidity >= 0.36.0;

import "Proposal.sol";
import "DemiurgeStore.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IBaseData.sol";
import "./interfaces/IClient.sol";

contract Demiurge is Base, IBaseData, IDemiurgeStoreCallback {

    uint16 constant ERROR_NOT_AUTHORIZED_TO_ADMIN =     101;
    uint16 constant ERROR_ID_ALREADY_TAKEN =            102;

    uint16 constant ERROR_NOT_AUTHORIZED_WALLET =       300;
    uint16 constant ERROR_PADAWAN_ALREADY_DEPLOYED =    301;
    uint16 constant ERROR_PROPOSAL_ALREADY_DEPLOYED =   302;
    uint16 constant ERROR_NOT_ALL_CHECKS_PASSED =       303;
    uint16 constant ERROR_INIT_ALREADY_COMPLETED =      304;
    uint16 constant ERROR_END_LOWER_THAT_START =        305;
    uint16 constant ERROR_NOW_LOWER_THAT_START =        306;
    uint16 constant ERROR_BAD_DATES =                   307;

    uint8 constant CHECK_PROPOSAL = 1;
    uint8 constant CHECK_PADAWAN = 2;

    TvmCell _padawanSI;
    TvmCell _proposalSI;

    mapping (uint => PadawanData) _deployedPadawans;
    mapping (address => uint32) _deployedProposals;

    mapping (uint32 => ProposalInfo) _lProposalInfo;
    mapping (uint32 => ProposalData) _lProposalData;

    ProposalResults[] _proposalResults;

    uint32 _deployedPadawansCounter = 0;
    uint32 _deployedProposalsCounter = 0;
    uint16 _version = 3;

    address _store;
    address _densRoot;

    uint8 _checkList;

    /*
    *  Inline work with checklist
    */

    function _createChecks() private inline {
        _checkList = CHECK_PADAWAN | CHECK_PROPOSAL;
    }

    function _passCheck(uint8 check) private inline {
        _checkList &= ~check;
    }

    function _allCheckPassed() private view inline returns (bool) {
        return (_checkList == 0);
    }

    modifier checksEmpty() {
        require(_allCheckPassed(), ERROR_NOT_ALL_CHECKS_PASSED);
        tvm.accept();
        _;
    }

    modifier onlyStore() {
        require(msg.sender == _store);
        tvm.accept();
        _;
    }

    /*
    * Initialization functions
    */

    constructor(address store, address densRoot) public {
        if (msg.sender == address(0)) {
            require(msg.pubkey() == tvm.pubkey(), 101);
        }
        tvm.accept();
        
        if (store != address(0)) {
            _store = store;
            DemiurgeStore(_store).queryImage{value: 0.2 ton, bounce: true}(ContractType.Proposal);
            DemiurgeStore(_store).queryImage{value: 0.2 ton, bounce: true}(ContractType.Padawan);
        }
        
        _densRoot = densRoot;

        _createChecks();
    }
    
    /*
     * Public Deploy API
     */

    function deployPadawan(uint pubkey) external checksEmpty {
        require(!_deployedPadawans.exists(pubkey), ERROR_PADAWAN_ALREADY_DEPLOYED);
        require(msg.value >= DEPLOY_FEE);
        TvmCell code = _padawanSI.toSlice().loadRef();
        TvmCell state = tvm.buildStateInit({
            contr: Padawan,
            varInit: {deployer: address(this)},
            pubkey: pubkey,
            code: code
        });
        address addr = new Padawan {stateInit: state, value: START_BALANCE}();
        _deployedPadawans[pubkey] = PadawanData(msg.sender, addr);
    }

    function onPadawanDeploy(uint key) external  {
        optional(PadawanData) opt = _deployedPadawans.fetch(key);
        require(opt.hasValue());
        PadawanData data = opt.get();
        require(msg.sender == data.addr);
        _deployedPadawansCounter++;
        Padawan(data.addr).initPadawan{value:0, flag: 64}(data.ownerAddress);
    }

    function _deployProposal(
        uint32 start,
        uint32 end,
        string title,
        ProposalType proposalType,
        TvmCell specific
    ) private {
        require(msg.value >= DEPLOY_PROPOSAL_FEE);

        uint32 idProposal = _deployedProposalsCounter;

        ProposalInfo proposalInfo = ProposalInfo(
            idProposal,
            start,
            end,
            title,
            uint32(now),
            proposalType,
            specific
        );

        _lProposalInfo[idProposal] = proposalInfo;

        /// @notice Deploy Proposal
        TvmCell code = _proposalSI.toSlice().loadRef();
        TvmCell state = tvm.buildStateInit({
            contr: Proposal,
            varInit: {_deployer: address(this)},
            pubkey: idProposal,
            code: code
        });
        address addr = new Proposal {stateInit: state, value: START_BALANCE}();
        _deployedProposals[addr] = idProposal;
        _lProposalData[idProposal] = ProposalData(
            idProposal,
            ProposalState.New,
            msg.sender,
            addr,
            uint32(now)
        );
    }

    function deploySetCodeProposal(
        uint32 start,
        uint32 end,
        string title,
        SetCodeProposalSpecific specific
    ) external checksEmpty {
        require(end > start, ERROR_END_LOWER_THAT_START);
        require(uint32(now) < start, ERROR_NOW_LOWER_THAT_START);
        require(end - start > 60 * 60 * 7, ERROR_BAD_DATES);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();
        _deployProposal(start, end, title, ProposalType.SetCode, cellSpecific);
    }

    function deployReserveProposal(
        uint32 start,
        uint32 end,
        string title,
        ReserveProposalSpecific specific
    ) external checksEmpty {
        require(end > start, ERROR_END_LOWER_THAT_START);
        require(uint32(now) < start, ERROR_NOW_LOWER_THAT_START);
        require(end - start > 60 * 60 * 7, ERROR_BAD_DATES);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();
        _deployProposal(start, end, title, ProposalType.Reserve, cellSpecific);
    }

    function deploySetOwnerProposal(
        uint32 start,
        uint32 end,
        string title,
        SetOwnerProposalSpecific specific
    ) external checksEmpty {
        require(end > start, ERROR_END_LOWER_THAT_START);
        require(uint32(now) < start, ERROR_NOW_LOWER_THAT_START);
        require(end - start > 60 * 60 * 7, ERROR_BAD_DATES);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();
        _deployProposal(start, end, title, ProposalType.SetOwner, cellSpecific);
    }

    function deploySetRootOwnerProposal(
        uint32 start,
        uint32 end,
        string title,
        SetRootOwnerProposalSpecific specific
    ) external checksEmpty {
        require(end > start, ERROR_END_LOWER_THAT_START);
        require(uint32(now) < start, ERROR_NOW_LOWER_THAT_START);
        require(end - start > 60 * 60 * 7, ERROR_BAD_DATES);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();
        _deployProposal(start, end, title, ProposalType.SetRootOwner, cellSpecific);
    }

    function onProposalDeploy() external  {
        optional(uint32) opt = _deployedProposals.fetch(msg.sender);
        require(opt.hasValue());
        uint32 key = opt.get();

        ProposalInfo proposalInfo = _lProposalInfo[key];

        Proposal(msg.sender).initProposal{value: DEF_COMPUTE_VALUE}(
            proposalInfo,
            _padawanSI
        );

        _deployedProposalsCounter++;
    }

    function onProposalFinalized(ProposalResults results) external  {
        optional(uint32) opt = _deployedProposals.fetch(msg.sender);
        require(opt.hasValue());
        uint32 proposalId = opt.get();
        _proposalResults.push(results);
        ProposalInfo proposalInfo = _lProposalInfo[proposalId];
        
        IClient(address(_densRoot)).onProposalPassed{
            value: DEF_COMPUTE_VALUE
        } (
            proposalInfo
        );
    }

    /*
    *  Setters
    */

    function setProposalSI(TvmCell c) external onlyStore {
        _proposalSI = c;
        _passCheck(CHECK_PROPOSAL);
    }

    function setPadawanSI(TvmCell c) external onlyStore {
        _padawanSI = c;
        _passCheck(CHECK_PADAWAN);
    }

    function updateABI(ContractType kind, string sabi) external override {
        require(false); kind; sabi;
    }

    function updateImage(ContractType kind, TvmCell image) override external  {
        require(msg.sender == _store);
        tvm.accept();
        if (kind == ContractType.Proposal) {
            _proposalSI = image;
            _passCheck(CHECK_PROPOSAL);
        } else if (kind == ContractType.Padawan) {
            _padawanSI = image;
            _passCheck(CHECK_PADAWAN);
        }
    }

    /*
    *   Get methods
    */

    function getImages() public view returns (TvmCell padawan, TvmCell proposal) {
        padawan = _padawanSI;
        proposal = _proposalSI;
    }

    function getDeployed() public view returns (mapping (uint => PadawanData) padawans, mapping (address => uint32) proposals) {
        padawans = _deployedPadawans;
        proposals = _deployedProposals;
    }

    function getProposalInfo() external  view returns (mapping (uint32 => ProposalInfo) proposals) {
        proposals = _lProposalInfo;
    }

    function getProposalData() external  view returns (mapping (uint32 => ProposalData) proposals) {
        proposals = _lProposalData;
    }

    function getStats() public view returns (uint16 version, uint32 deployedPadawansCounter, uint32 deployedProposalsCounter) {
        version = _version;
        deployedPadawansCounter = _deployedPadawansCounter;
        deployedProposalsCounter = _deployedProposalsCounter;
    }

    function getPadawan(uint key) public view returns (PadawanData data) {
        data = _deployedPadawans[key];
    }
}
