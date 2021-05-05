pragma ton-solidity >= 0.36.0;
import "../Glossary.sol";

interface IBaseData {

    struct ProposalInfo {
        uint32 id;                  // Proposal ID
        uint32 start;               // Start of the voting
        uint32 end;                 // Timestamp of the voting end
        string title;               // Proposal title
        uint32 ts;                  // Creation time
        ProposalType proposalType;  // Proposal type
        TvmCell specific;           // Proposal specific data
    }

    struct VoteDistributionParameters {
        uint32 id;
        uint32 ts;
    }

    struct PadawanData {
        address ownerAddress;
        address addr;
    }

    struct ProposalData {
        uint32 id;
        ProposalState state;
        address ownerAddress;
        address addr;
        uint32 ts;
        uint32 contestId;
    }

    struct ProposalResults {
        uint32 id;
        bool passed;
        uint32 votesFor;
        uint32 votesAgainst;
        uint32 totalVotes;
        VoteCountModel model;
        uint32 ts;
    }

}

