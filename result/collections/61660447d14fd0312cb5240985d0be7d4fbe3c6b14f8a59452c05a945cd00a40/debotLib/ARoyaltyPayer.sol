pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

abstract contract ARoyaltyPayer {

    address _addrIntermediary;
    uint8 _royaltyPercentIntermediary;
    address _addrNftAuthor;
    uint8 _royaltyPercentAuthor;

    function payRoyalty (uint128 payment) internal inline view {
        uint128 royaltyIntermediary = math.muldiv(payment, _royaltyPercentIntermediary, 100);
        _addrIntermediary.transfer({value: royaltyIntermediary, flag: 1});

        uint128 royaltAuthor = math.muldiv((payment - royaltyIntermediary), _royaltyPercentAuthor, 100);
        _addrNftAuthor.transfer({value: royaltAuthor, flag: 1});
    }
}
