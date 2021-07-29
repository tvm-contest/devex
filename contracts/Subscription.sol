pragma ton-solidity >=0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;

interface ISubscription {
	function serviceKey() external returns (uint256);
}

contract Subscription {
    uint256 static public serviceKey;

}