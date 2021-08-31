pragma ton-solidity ^ 0.47.0;
import "https://raw.githubusercontent.com/tonlabs/debots/main/Sdk.sol";

enum Status {
    Success, ZeroKey, EmptySubscription, InvalidSigningBoxHandle,
    MultisigFailed, LowWalletBalance, InactiveWallet, WalletFrozen
}

interface ISubsManCallbacks {
    function onSubscriptionDeploy(Status status) external;
}

interface ISubsManCallbacksService {
    function onSubscriptionServiceDeploy(Status status, address addr) external;
}

interface IonQuerySubscriptions {
    function onQuerySubscriptions(AccData[] accounts) external;
}

interface IonQuerySubscribers {
    function onQuerySubscribers(uint256[] keys) external;
}

interface IonSignSubscriptionWalletCode {
    function walletDetails() external;
}
