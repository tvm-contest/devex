pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;

import "NotificationAddress.sol";

contract CollectionToken {

    event TK_CO_nifi_col1_1(uint64 _collectionId, uint32 index, address newOwner);
    event TK_MG_nifi_col1_1(uint64 _collectionId, uint32 index, address newManager, uint32 expirationTime);

    address static _root;
    address static _collection;
    uint64 static _collectionId;
    uint8 static _id1;
    uint8 static _id2;
    uint8 static _id3;
    uint8 static _id4;
    uint8 static _id5;

    address _owner;
    address _manager;
    uint32  _managerUnlockTime;

    address _creator;
    uint32 _creatorFees;

    uint32 _index;

    modifier onlyCollection() {
        require(msg.sender == _collection, 101, "Method for the collection only");
        _;
    }

    modifier onlyLockedManager{
        require(msg.sender == _manager && now < _managerUnlockTime, 103, "Method for locked manager only");
        _;
    }

    modifier onlyUnlockedOwnerOrLockedManager {
        require((msg.sender == _owner && now >= _managerUnlockTime) ||
                (msg.sender == _manager && now < _managerUnlockTime),
                104,
                "Method for the owner or manager only"
        );
        _;
    }

    modifier unlockTimeIsValid(uint32 unlockTime) {
        require(now < unlockTime, 105, "Invalid lock time");
        _;
    }

    modifier addressIsNotNull(address addr) {
        require(addr.value != 0, 106, "Address can't be null");
        _;
    }

    modifier validCreatorFees(uint32 fees) {
        require(fees < 2401, 107, "Unvalid creator fees");
        _;
    }

    modifier accept {
        tvm.accept();
        _;
    }

    constructor(
        address owner,
        address creator,
        uint32  creatorFees,
        uint32 index
    )
        public
        onlyCollection
        addressIsNotNull(creator)
        addressIsNotNull(owner)
        accept
    {
        _owner = owner;
        _creator = creator;
        _creatorFees = creatorFees;
        _index = index;
    }

    function changeOwner(address owner)
        public
        onlyUnlockedOwnerOrLockedManager
        addressIsNotNull(owner)
        accept
    {
        _owner = owner;
        emit TK_CO_nifi_col1_1{dest: NotificationAddress.value()}(_collectionId, _index, _owner);
    }

    function getInfo() public view returns(address root, address collection, uint64 collectionId, uint8 id1, uint8 id2, uint8 id3, uint8 id4, uint8 id5) {
        root = _root;
        collection = _collection;
        collectionId = _collectionId;
        id1 = _id1;
        id2 = _id2;
        id3 = _id3;
        id4 = _id4;
        id5 = _id5;
    }

    function receiveTradeInfo() public view responsible returns(
            address owner,
            address creator,
            uint32  creatorFees,
            address manager,
            uint32  managerUnlockTime
        ) {
        return{value: 0, bounce: false, flag: 64} getTradeInfo();
    }

    function getTradeInfo() public view returns(address owner, address creator, uint32 creatorFees, address manager, uint32 managerUnlockTime) {
        owner = _owner;
        creator = _creator;
        creatorFees = _creatorFees;
        manager = _manager;
        managerUnlockTime = _managerUnlockTime;
    }


    function lockManager(address manager, uint32 unlockTime)
        public
        onlyUnlockedOwnerOrLockedManager
        addressIsNotNull(manager)
        unlockTimeIsValid(unlockTime)
        accept
    {
        _manager = manager;
        _managerUnlockTime = unlockTime;
        emit TK_MG_nifi_col1_1{dest: NotificationAddress.value()}(_collectionId, _index, _manager, _managerUnlockTime);
    }

    function unlock() public onlyLockedManager accept {
        _managerUnlockTime = 0;
    }

}
