pragma ton-solidity >= 0.36.0;

interface IProposal {
    function voteFor(uint256 key, bool choice, uint32 deposit) external;
    function queryStatus() external; // callback: updateStatus(proposalState status)
    function wrapUp() external;
}
