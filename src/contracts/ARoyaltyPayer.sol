pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

abstract contract ARoyaltyPayer {

    address _addrRoyaltyAgent;
    uint8 _royaltyPercent;

    function payRoyalty(uint128 payment) internal inline view returns (uint128) {
        uint128 royaltyAgent = math.muldiv(payment, _royaltyPercent, 100);
        _addrRoyaltyAgent.transfer({value: royaltyAgent, flag: 1});
        return payment - royaltyAgent;
    }
}
