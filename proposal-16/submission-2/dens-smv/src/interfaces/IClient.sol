pragma ton-solidity >= 0.36.0;
import './IInfoCenter.sol';

interface IClient is IBaseData {
    function onProposalPassed(ProposalInfo proposalInfo) external;
}