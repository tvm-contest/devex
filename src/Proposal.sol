pragma ton-solidity >= 0.36.0;

import "Base.sol";
import "Padawan.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IDemiurge.sol";
import "./interfaces/IInfoCenter.sol";

contract Proposal is Base, IProposal, IBaseData {

    uint16 constant ERROR_NOT_AUTHORIZED_VOTER  =   302; // Only ProposalInitiatorWallet cal create proposals
    uint16 constant ERROR_TOO_EARLY_FOR_RECLAIM =   303; // Can't return deposit before proposal expiration

//    uint16 constant ERROR_NOT_AUTHORIZED_VOTER  = 250; // Votes are not accepted at this time
    uint16 constant ERROR_VOTING_NOT_STARTED    = 251;   // Votes are not accepted at this time
    uint16 constant ERROR_VOTING_HAS_ENDED      = 252;  // Votes are not accepted at this time
    uint16 constant ERROR_VOTING_HAS_NOT_ENDED  = 253;  // Votes are not accepted at this time
    uint16 constant ERROR_VOTER_IS_NOT_ELIGIBLE = 254;  // Voter is not eligible to vote for this proposal

    ProposalInfo _proposalInfo;
    address static _deployer;

    bool _hasWhitelist;
    mapping (address => bool) _voters;
    TvmCell _padawanSI;

    struct ProposalStatus {
        ProposalState state;
        uint32 votesFor;
        uint32 votesAgainst;
    }

    ProposalResults _results;

    ProposalStatus _state;
    VoteCountModel _voteCountModel;

    event ProposalFinalized(ProposalResults results);

    constructor() public {
        require(_deployer == msg.sender);
        _state.state = ProposalState.New;
        IInfoCenter(_deployer).onProposalDeploy{value: DEF_RESPONSE_VALUE}();
    }

    function initProposal(ProposalInfo proposalInfo, TvmCell padawanSI) external {
        _proposalInfo = proposalInfo;
        _padawanSI = padawanSI;

        _voteCountModel = VoteCountModel.SoftMajority;

        _state.state = ProposalState.OnVoting;
    }

    function wrapUp() external override {
        _wrapUp();
        msg.sender.transfer(0, false, 64);
    }

    /* Implements SMV algorithm and has vote function to receive ‘yes’ or ‘no’ votes from Voting Wallet. */
    function voteFor(uint256 key, bool choice, uint32 deposit) external override {
        TvmCell code = _padawanSI.toSlice().loadRef();
        TvmCell state = tvm.buildStateInit({
            contr: Padawan,
            varInit: {deployer: _deployer},
            pubkey: key,
            code: code
        });
        address padawanAddress = address.makeAddrStd(0, tvm.hash(state));
        uint16 errorCode = 0;
        address from = msg.sender;

        if (padawanAddress != from) {
            errorCode = ERROR_NOT_AUTHORIZED_VOTER;
        } else if (now < _proposalInfo.start) {
            errorCode = ERROR_VOTING_NOT_STARTED;
        } else if (now > _proposalInfo.end) {
            errorCode = ERROR_VOTING_HAS_ENDED;
        } else if (_hasWhitelist) {
            if (!_voters.exists(from)) {
                errorCode = ERROR_VOTER_IS_NOT_ELIGIBLE;
            }
        }

        if (errorCode > 0) {
            IPadawan(from).rejectVote{value: 0, flag: 64, bounce: true}(_proposalInfo.id, deposit, errorCode);
        } else {
            IPadawan(from).confirmVote{value: 0, flag: 64, bounce: true}(_proposalInfo.id, deposit);
            if (choice) {
                _state.votesFor += deposit;
            } else {
                _state.votesAgainst += deposit;
            }
        }

        _wrapUp();
    }

    function finalize(bool passed) external me {
        tvm.accept();

        _results = ProposalResults(
            _proposalInfo.id,
            passed,
            _state.votesFor,
            _state.votesAgainst,
            21000000,
            _voteCountModel,
            uint32(now)
        );

        ProposalState state = passed ? ProposalState.Passed : ProposalState.Failed;
        _transit(state);
        emit ProposalFinalized(_results);
        uint128 bondValue = 1 ton;
        IInfoCenter(_deployer).onProposalFinalized{value: bondValue}(_results);
    }

    function _calculateVotes(
        uint32 yes,
        uint32 no,
        uint32 total,
        VoteCountModel model
    ) private inline pure returns (bool) {
        bool passed = false;
        passed = (yes * total * 10 > total * total + no * (8 * total  + 20));
        return passed;
    }

    uint public _t1;
    uint public _t2;
    uint public _t3;
    uint public _t4;

    function _tryEarlyComplete(
        uint32 yes,
        uint32 no,
        uint32 total,
        VoteCountModel model
    ) private inline returns (bool, bool) {
        (bool completed, bool passed) = (false, false);
        _t1 = yes;
        _t2 = no;
        _t3 = total;
        // _t4 = (yes * total * 10);
        if (2 * yes >= total) {
            completed = true;
            passed = true;
        } else if(2 * no >= total) {
            completed = true;
            passed = false;
        }
        return (completed, passed);
    }

    function _transit(ProposalState state) private inline {
        _state.state = state;
    }

    function _wrapUp() private {
        (bool completed, bool passed) = (false, false);
        if (now > _proposalInfo.end) {
            completed = true;
            passed = _calculateVotes(_state.votesFor, _state.votesAgainst, 21000000, _voteCountModel);
        } else {
            (completed, passed) = _tryEarlyComplete(
                _state.votesFor,
                _state.votesAgainst,
                21000000,
                _voteCountModel
            );
        }

        if (completed) {
            _transit(ProposalState.Ended);
            this.finalize{value: DEF_COMPUTE_VALUE}(passed);
        }
    }

    function queryStatus() external override {
        IPadawan(msg.sender).updateStatus(_proposalInfo.id, _state.state);
    }

    /*
    *   Get Methods
    */

    function getId() public view returns (uint256 id) {
        id = tvm.pubkey();
    }

    function getVotingResults() public view returns (ProposalResults vr) {
        require(_state.state > ProposalState.Ended, ERROR_VOTING_HAS_NOT_ENDED);
        vr = _results;
    }

    function getInfo() public view returns (ProposalInfo info) {
        info = _proposalInfo;
    }

    function getCurrentVotes() public view returns (uint32 votesFor, uint32 votesAgainst) {
        return (_state.votesFor, _state.votesAgainst);
    }

    function getProposalData() public view returns (ProposalInfo info, ProposalStatus status) {
        return (_proposalInfo, _state);
    }

}
