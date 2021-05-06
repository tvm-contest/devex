pragma ton-solidity >=0.42.0;

struct ReserveProposalSpecific {
    string name;
    uint32 ts;
}

interface IDemiurge {
    function deployPadawan(uint pubkey) external;
    function deployReserveProposal(
        uint32 start,
        uint32 end,
        string title,
        ReserveProposalSpecific specific
    ) external;
}

interface IPadawan {
    function createTokenAccount(address tokenRoot) external;
    function voteFor(address proposal, bool choice, uint32 votes) external;
    function depositTokens(address returnTo, uint256 tokenId, uint64 tokens) external;
    function reclaimDeposit(uint32 deposit) external;
    function confirmVote(uint64 pid, uint32 deposit) external;
    function rejectVote(uint64 pid, uint32 deposit, uint16 ec) external;
 

    function getActiveProposals() external returns (mapping(address => uint32) activeProposals);
}

contract Helper {
    // Encode call to call_me() with a given parameter. Return resulting message body as a cell
    function encode_deployPadawan_call(uint pubkey) public pure returns (TvmCell) {
        return tvm.encodeBody(IDemiurge.deployPadawan, pubkey);
    }

    function encode_createTokenAccount_call(address tokenRoot) public pure returns (TvmCell) {
        return tvm.encodeBody(IPadawan.createTokenAccount, tokenRoot);
    }

    function encode_depositTokens_call(address returnTo, uint256 tokenId, uint64 tokens) public pure returns (TvmCell) {
        return tvm.encodeBody(IPadawan.depositTokens,  returnTo,  tokenId, tokens);
    }

    function encode_deployReserveProposal_call(
        uint32 start,
        uint32 end,
        string title,
        ReserveProposalSpecific specific) public pure returns (TvmCell) {
        return tvm.encodeBody(IDemiurge.deployReserveProposal,  start,  end, title, specific);
    }

    function encode_voteFor_call(address proposal, bool choice, uint32 votes) public pure returns (TvmCell payload) {
        return tvm.encodeBody(IPadawan.voteFor, proposal,choice,votes);
    }
}