pragma ton-solidity >= 0.36.0;
import "../Glossary.sol";
import "./IBaseData.sol";


struct SetCodeProposalSpecific {
    uint8 ContractType;
    TvmCell code;
}
struct ReserveProposalSpecific {
    string name;
    uint32 ts;
}
struct SetOwnerProposalSpecific {
    string name;
    address owner;
    uint128 ts;
}
struct SetRootOwnerProposalSpecific {
    uint256 pubkey;
    string comment;
}

interface IInfoCenter is IBaseData {
    function onContestDeploy(uint32 id) external;
    function onProposalDeploy() external;
    function onStateUpdate(ProposalState state) external;
    function onProposalFinalized(ProposalResults results) external;
    function registerJuryMember(string tag, uint pubkey) external;
}