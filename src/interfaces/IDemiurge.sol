pragma ton-solidity >= 0.36.0;
import "IBaseData.sol";
import "IInfoCenter.sol";

interface IDemiurge {
    function deployPadawan(uint userKey) external;
    function onPadawanDeploy(uint key) external;

    function deploySetCodeProposal(
        uint32 start,
        uint32 end,
        string title,
        SetCodeProposalSpecific specific
    ) external;

    function deployReserveProposal(
        uint32 start,
        uint32 end,
        string title,
        ReserveProposalSpecific specific
    ) external;

    function deploySetOwnerProposal(
        uint32 start,
        uint32 end,
        string title,
        SetOwnerProposalSpecific specific
    ) external;

    function deploySetRootOwnerProposal(
        uint32 start,
        uint32 end,
        string title,
        SetRootOwnerProposalSpecific specific
    ) external;

    function getProposalInfo() external view returns (mapping (uint32 => IBaseData.ProposalInfo) proposals);
    function getProposalData() external view returns (mapping (uint32 => IBaseData.ProposalData) proposals);
    function getPadawan(uint key) external view returns (IBaseData.PadawanData data);
}
