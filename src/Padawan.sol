pragma ton-solidity >= 0.36.0;

import "Base.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IPadawan.sol";
import "./interfaces/IDemiurge.sol";
import "./interfaces/ITokenRoot.sol";
import "./interfaces/ITokenWallet.sol";

contract Padawan is Base {
    uint32 constant ERROR_UNAUTHORIZED_CALLER = 110;
    uint32 constant ERROR_NOT_ENOUGH_VOTES = 111;
    uint32 constant ERROR_NO_MORE_THAN_ONE_RECLAIM_AT_A_TIME = 112;
    uint32 constant ERROR_NOT_A_USER_WALLET = 113;
    uint32 constant ERROR_MSG_VALUE_TOO_LOW = 114;

    uint32 constant ERROR_TOKEN_ACCOUNT_ALREADY_EXISTS = 115;
    uint32 constant ERROR_INVALID_ROOT_CALLER = 116;
    uint32 constant ERROR_ANSWER_ID_NOT_FOUND = 117;
    uint32 constant ERROR_ACCOUNT_DOES_NOT_EXIST = 118;
    uint32 constant ERROR_DEPOSIT_NOT_FOUND = 119;
    uint32 constant ERROR_CALLER_IS_NOT_DEPOOL = 120;
    uint32 constant ERROR_DEPOSIT_WITH_SUCH_ID_EXISTS = 121;
    uint32 constant ERROR_PENDING_DEPOSIT_ALREADY_EXISTS = 122;
    uint32 constant ERROR_INVALID_DEPLOYER = 123;

    struct Deposit {
        uint256 tokenId;
        address returnTo;
        uint64 amount;
        uint64 valuePerVote;
        bool approved;
        uint256 depool;
    }

    // ProposalDeployer address
    address static deployer;
    // User address
    address _ownerAddress;

    // Collection of Padawan's token accounts.
    // map [token root address] => account struct
    mapping (address => TipAccount) tokenAccounts;
    // Set of deposits of different currencies (crystals, tip tokens, depool stake)
    // map [createdAt] => Deposit struct
    mapping (uint32 => Deposit) deposits;

    // predefined TokenId for Crystals currency
    uint256 _crystalsID = 0;

    // Set of proposal address for which user is voted and which are not finalized yet.
    mapping(address => uint32) _activeProposals;

    // Set of proposal votes.
    // Used for easy querying locked votes.
    // map [votes] -> counter
    mapping(uint32 => uint32) _spentVotes;

    // Number of votes requested to reclaim
    uint32 _requestedVotes;
    // Total number of votes available to user.
    uint32 _totalVotes;
    // Number of votes that cannot be reclaimed until finish of one of active proposals.
    uint32 _lockedVotes;
    // Id of token deposit that is not approved yet.
    // If  == 0, there is no pending deposits.
    uint32 _pendingDepositId;

    address _tokenRoot;

    event VoteRejected(uint64 pid, uint32 votes, uint16 ec);

    /*
     *  Helpers
     */

    modifier contractOnly() {
        require(msg.sender != address(0));
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == _ownerAddress, ERROR_NOT_A_USER_WALLET);
        _;
    }

    /*
    *  Initialization
    */

    constructor(address tokenRoot) public contractOnly {
        require(deployer == msg.sender, ERROR_INVALID_DEPLOYER);
        _tokenRoot = tokenRoot;
        IDemiurge(deployer).onPadawanDeploy{value: 1 ton}(tvm.pubkey());
        _createTokenAccount();
    }

    function initPadawan(address ownerAddress) external {
        require(msg.sender == deployer, ERROR_UNAUTHORIZED_CALLER);
        _ownerAddress = ownerAddress;
    }

    /*
    *  Public Voting API
    */

    /// @notice Allows user to vote for proposal.
    function voteFor(address proposal, bool choice, uint32 votes) external onlyOwner {
        optional(uint32) opt = _activeProposals.fetch(proposal);
        uint32 proposalVotes = opt.hasValue() ? opt.get() : 0;
        uint32 availableVotes = _totalVotes - proposalVotes;
        require(votes <= availableVotes, ERROR_NOT_ENOUGH_VOTES);

        if (!opt.hasValue()) {
            _activeProposals[proposal] = 0;
        }
        IProposal(proposal).voteFor{value: 0, flag: 64, bounce: true}(tvm.pubkey(), choice, votes);
    }

    /// @notice Called by Proposal smc in case if votes are accepted.
    function confirmVote(uint64 pid, uint32 deposit) external contractOnly {
        // pid - unused
        pid = pid;

        optional(uint32) opt = _activeProposals.fetch(msg.sender);
        require(opt.hasValue());
        uint32 propVotes = opt.get();
        uint32 newPropVotes = deposit + propVotes;
        _activeProposals[msg.sender] = newPropVotes;

        _deleteSpentVotes(propVotes);

        _spentVotes[newPropVotes] += 1;

        _updateLockedVotes();
        // return change for `voteFor` back to user
        _ownerAddress.transfer(0, false, 64);
    }

    /// @notice Called by Proposal smc in case if votes are rejected.
    function rejectVote(uint64 pid, uint32 deposit, uint16 ec) external contractOnly {
        optional(uint32) opt = _activeProposals.fetch(msg.sender);
        require(opt.hasValue());
        uint32 propVotes = opt.get();
        if (propVotes == 0) {
            delete _activeProposals[msg.sender];
        }
        _ownerAddress.transfer(0, false, 64);
        emit VoteRejected(pid, deposit, ec);
    }

    /// @notice Allows to withdraw unlocked user votes back in crystal or tons.
    /// @param votes - number of votes to reclaim.
    function reclaimDeposit(uint32 votes) external onlyOwner {
        require(msg.value >= DEPOSIT_TONS_FEE, ERROR_MSG_VALUE_TOO_LOW);
        require(votes <= _totalVotes, ERROR_NOT_ENOUGH_VOTES);
        _requestedVotes = votes;

        if (_requestedVotes <= _totalVotes - _lockedVotes) {
            _unlockDeposit();
        }
        // need to query status of each active proposal
        optional(address, uint32) proposal = _activeProposals.min();
        while (proposal.hasValue()) {
            (address addr, /* uint128 votes*/) = proposal.get();
            IProposal(addr).queryStatus{value: QUERY_STATUS_FEE, bounce: true, flag: 1}();
            proposal = _activeProposals.next(addr);
        }
    }

    /*
    *  Groups API
    */

    /// @notice Receives proposal status. Called by Proposal smc as an answer on queryStatus().
    function updateStatus(uint64 pid, ProposalState state) external contractOnly {
        pid = pid;
        optional(uint32) opt = _activeProposals.fetch(msg.sender);
        require(opt.hasValue());
        tvm.accept();

        // if proposal is ended
        if (state >= ProposalState.Ended) {
            _deleteSpentVotes(opt.get());
            _updateLockedVotes();
            delete _activeProposals[msg.sender];
        }

        if (_requestedVotes <= _totalVotes - _lockedVotes) {
            _unlockDeposit();
        }
    }

    /*
    *   Private functions
    */

    function _deleteSpentVotes(uint32 votes) private {
        optional(uint32) spentOpt = _spentVotes.fetch(votes);
        if (spentOpt.hasValue()) {
            uint32 counter = spentOpt.get();
            if (counter > 1) {
                _spentVotes[votes] = counter - 1;
            } else {
                delete _spentVotes[votes];
            }
        }
    }

    /// @notice update locked votes
    function _updateLockedVotes() private inline {
        uint32 maxVotes = 0;
        optional(uint32, uint32) maxVotesOpt = _spentVotes.max();
        if (maxVotesOpt.hasValue()) {
            (uint32 votes, ) = maxVotesOpt.get();
            maxVotes = votes;
        }
        if (_lockedVotes != maxVotes) {
            _lockedVotes = maxVotes;
        }
    }

    function _unlockDeposit() private {
        uint32 origVotes = _requestedVotes;

        optional(uint32, Deposit) depo = deposits.max();
        while (depo.hasValue()) {
            (uint32 createdAt, Deposit deposit) = depo.get();
            if (_requestedVotes != 0) {
                uint32 votes = math.min(_requestedVotes, uint32(deposit.amount / deposit.valuePerVote));
                uint64 value = uint64(deposit.valuePerVote * votes);

                if (deposit.tokenId == _crystalsID) {
                    _ownerAddress.transfer(value, false, 0);
                // } else if (deposit.tokenId == _depoolID) {
                //     // user can reclaim only all depool stake at once.
                //     if (value >= deposit.amount) {
                //         // address depool = address.makeAddrStd(0, deposit.depool);
                //         // IDePool(depool).transferStake{value: 0.5 ton, flag: 1}
                //         //     (deposit.returnTo, deposit.amount);
                //     } else {
                //         (votes, value) = (0, 0);
                //     }
                } else {
                    TipAccount acc = tokenAccounts[address.makeAddrStd(0, deposit.tokenId)];
                    ITokenWallet(acc.addr).transfer{value: 0.1 ton + 0.1 ton}
                        (deposit.returnTo, value, false, acc.addr);
                }

                deposit.amount -= math.min(value, deposit.amount);
                if (deposit.amount == 0) {
                    delete deposits[createdAt];
                } else {
                    deposits[createdAt] = deposit;
                }
                _requestedVotes -= math.min(votes, _requestedVotes);
            }

            depo = deposits.prev(createdAt);
        }
        _totalVotes -= origVotes - _requestedVotes;
    }

    function _genId() private pure inline returns (uint32) {
        return uint32(now);
    }

    /* Receiving interface */

    /// @notice Plain receiving of tons.
    receive() external {
    }

    /// @notice Accept income messages.
    fallback() external {
    }

    /// @notice Plain transfer of tons.
    function transferFunds(address to, uint128 val) external pure onlyOwner {
        to.transfer(val, true, 1);
    }

    /*
     *  Public Deposits API
     */

    /// @notice Allows to deposit tip3 tokens
    /// @param returnTo - address to which return tokens in case of reclaim request.
    /// @param tokenId - ID of deposited tip3 token (it is a std addr of TokenRoot smc).
    /// @param tokens - Number of tokens to deposit.
    function depositTokens(
        address returnTo,
        uint256 tokenId,
        uint64 tokens
    ) external onlyOwner {
        uint32 createdAt = _genId();
        require(!deposits.exists(createdAt), ERROR_DEPOSIT_WITH_SUCH_ID_EXISTS);
        require(_pendingDepositId == 0, ERROR_PENDING_DEPOSIT_ALREADY_EXISTS);
        require(msg.value >= DEPOSIT_TOKENS_FEE, ERROR_MSG_VALUE_TOO_LOW);

        optional(TipAccount) opt = tokenAccounts.fetch(address.makeAddrStd(0, tokenId));
        require(opt.hasValue(), ERROR_ACCOUNT_DOES_NOT_EXIST);
        TipAccount acc = opt.get();

        _pendingDepositId = createdAt;
        ITokenWallet(acc.addr).getBalance_InternalOwner{value: 0, flag: 64, bounce: true}
            (tvm.functionId(onGetBalance));
        deposits[createdAt] = Deposit(tokenId, returnTo, tokens, 0, false, 0);
    }

    /*
     *  Private deposit functions
     */
    function _convertDepositToVotes(uint32 queryId, uint64 price) private inline {
        optional(Deposit) opt = deposits.fetch(queryId);
        require(opt.hasValue(), ERROR_DEPOSIT_NOT_FOUND);
        Deposit depo = opt.get();
        deposits[queryId].valuePerVote = price;
        _totalVotes += uint32(depo.amount / price);
    }

    function _findTokenAccount(address addr) private view inline returns (optional(address, TipAccount)) {
        optional(address, TipAccount) account = tokenAccounts.min();
        while (account.hasValue()) {
            (address root, TipAccount acc) = account.get();
            if (acc.addr == addr) {
                return account;
            }
            account = tokenAccounts.next(root);
        }
        return account;
    }

    function onGetBalance(uint128 balance) public contractOnly {
        optional(address, TipAccount) account = _findTokenAccount(msg.sender);
        require(account.hasValue(), ERROR_ACCOUNT_DOES_NOT_EXIST);
        require(_pendingDepositId != 0);

        (address root, TipAccount acc) = account.get();

        uint128 prevBalance = acc.balance;
        tokenAccounts[root].balance = balance;

        optional(Deposit) opt = deposits.fetch(_pendingDepositId);
        require(opt.hasValue(), ERROR_DEPOSIT_NOT_FOUND);
        Deposit dep = opt.get();
        if (balance >= dep.amount + prevBalance) {
            deposits[_pendingDepositId].approved = true;
            _convertDepositToVotes(_pendingDepositId, 1);
            // _ownerAddress.transfer(0, false, 64);
        } else {       
            delete deposits[_pendingDepositId];
        }
        _pendingDepositId = 0;
    }

    /*
    *  Token Account Collection
    */

    function onTokenWalletDeploy(address ownerAddress) public {
        optional(TipAccount) opt = tokenAccounts.fetch(msg.sender);
        require(opt.hasValue(), ERROR_INVALID_ROOT_CALLER);
        TipAccount acc = opt.get();

        acc.addr = ownerAddress;
        tokenAccounts[msg.sender] = acc;

        _ownerAddress.transfer(0, false, 64);
    }

    function _createTokenAccount() private {
        uint256 owner = address(this).value;
        tokenAccounts[_tokenRoot] = TipAccount(address(0), owner, uint32(now), 0);

        ITokenRoot(_tokenRoot).deployEmptyWallet{value: 2 ton, flag: 1, bounce: true}
            (tvm.functionId(onTokenWalletDeploy), 0, 0, owner, 1 ton);
    }

    /*
    *  Get Methods
    */

    function getDeposits() public view returns (mapping (uint32 => Deposit) allDeposits) {
        allDeposits = deposits;
    }

    function getTokenAccounts() external view returns (mapping (address => TipAccount) allAccounts) {
        allAccounts = tokenAccounts;
    }

    function getVoteInfo() external view returns (uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) {
        reqVotes = _requestedVotes;
        totalVotes =  _totalVotes;
        lockedVotes = _lockedVotes;
    }

    function getAddresses() public view returns (address ownerAddress) {
        ownerAddress = _ownerAddress;
    }

    function getActiveProposals() public view returns (mapping(address => uint32) activeProposals) {
        activeProposals = _activeProposals;
    }
}
