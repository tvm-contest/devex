pragma ton-solidity >= 0.36.0;
import "IBaseData.sol";

interface IDemiurge {
    function deployPadawan(uint userKey) external;
    function onPadawanDeploy(uint key) external;

    function deployProposal(
        uint32 totalVotes,
        uint32 start,
        uint32 end,
        string description,
        string text,
        VoteCountModel model
    ) external;

    function deployProposalWithWhitelist(
        uint32 totalVotes,
        uint32 start,
        uint32 end,
        string description,
        string text,
        VoteCountModel model,
        address[] voters
    ) external;

    function deployProposalForContest(
        uint32 totalVotes,
        uint32 start,
        uint32 end,
        string description,
        string title,
        VoteCountModel model,
        uint32 contestDuration, // period of accepting submissions
        uint128 prizePool,
        string[] tags
    ) external;

    function getProposalInfo() external view returns (mapping (uint32 => IBaseData.ProposalInfo) proposals);
    function getProposalData() external view returns (mapping (uint32 => IBaseData.ProposalData) proposals);
}
