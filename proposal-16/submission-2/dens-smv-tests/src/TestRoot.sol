pragma ton-solidity >= 0.36.0;

import "./interfaces/IClient.sol";
import "./interfaces/IInfoCenter.sol";
import "./interfaces/IBaseData.sol";


contract Demiurge is IClient {
    ProposalInfo public _proposalInfo;
    ReserveProposalSpecific public _specific;

    constructor() public {
        tvm.accept();
    }

    function onProposalPassed(ProposalInfo proposalInfo) external override {
        _proposalInfo = proposalInfo;
        TvmCell c = proposalInfo.specific;
        _specific = c.toSlice().decode(ReserveProposalSpecific);
        msg.sender.transfer(0, false, 64);
    }
}
