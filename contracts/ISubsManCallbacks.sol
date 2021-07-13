pragma ton-solidity >=0.43.0;

enum Status {
    Success, ZeroKey, EmptySubscription, InvalidSigningBoxHandle,
    MultisigFailed, LowWalletBalance, InactiveWallet
}

interface ISubsManCallbacks {
    function onSubscriptionDeploy(Status status, address addr) external;
}

interface IonQuerySubscriptions {
    function onQuerySubscriptions(uint256[] subscription) external;
}