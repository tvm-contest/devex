pragma ton-solidity >=0.43.0;

pragma AbiHeader expire;
pragma AbiHeader time;

abstract contract ARoyaltyRecipient {

    address _addrRoyaltyAgent;
    uint8 _royaltyPercent;

    function changeRoyaltyAgent(address addrRoyaltyAgent) external onlyRoyaltyAgent {
        _addrRoyaltyAgent = addrRoyaltyAgent;
    }

    function getRoyaltyInfo() external view returns (address addrRoyaltyAgent, uint8 royaltyPercent) {
        addrRoyaltyAgent = _addrRoyaltyAgent;
        royaltyPercent = _royaltyPercent;
    }

    // MODIFIERS

    modifier validRoyalty(uint8 royaltyPercent) {
        require(royaltyPercent < 100);
        _;
    }

    modifier validRoyaltyAgent(address addrRoyaltyAgent) {
        require(addrRoyaltyAgent != address(0));
        _;
    }

    modifier onlyRoyaltyAgent {
        require(msg.sender == _addrRoyaltyAgent);
        _;
    }
}