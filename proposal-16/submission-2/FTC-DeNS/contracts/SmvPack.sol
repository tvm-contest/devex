pragma ton-solidity ^0.38.0;

interface IClient {
    function onProposalPassed(ProposalInfo proposalInfo) external;
}

struct ProposalInfo {
    uint32 id;                  // Proposal ID
    uint32 start;               // Start of the voting
    uint32 end;                 // Timestamp of the voting end
    string title;               // Proposal title
    uint32 ts;                  // Creation time
    ProposalType proposalType;  // Proposal type
    TvmCell specific;           // Proposal specific data
}

enum ProposalType { Undefined, SetCode, Reserve, DeployCert, SetRootOwner }

struct SetCodeProposalSpecific {
    uint8 ContractType;
    TvmCell code;
}

struct ReserveProposalSpecific {
    string name;
    uint32 ts;
}

struct DeployCertProposalSpecific {
    string name;
    address owner;
    uint128 ts;
}

struct SetRootOwnerProposalSpecific {
    uint256 pubkey;
    string comment;
}