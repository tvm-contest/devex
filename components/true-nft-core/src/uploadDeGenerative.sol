pragma ton-solidity >= 0.35.0;
pragma AbiHeader time;
pragma AbiHeader expire;
import "./NftRoot.sol";
contract CustomReplaySample {
    uint8 constant MAX_CLEANUP_MSGS = 30;
    mapping(uint => uint32) messages;
    uint public value;

    constructor() public {
        require(tvm.pubkey() != 0, 101);
        require(msg.pubkey() == tvm.pubkey(), 102);
        tvm.accept();
    }

    modifier onlyOwnerAndAccept {
        require(msg.pubkey() == tvm.pubkey(), 102);
        tvm.accept();
        _;
    }

    function sendMetadata(address adr,bytes metadata) public onlyOwnerAndAccept {
        gc();
        NftRoot(adr).addMetadata(metadata);
    }
    function startSelling(address adr) public onlyOwnerAndAccept {
        gc();
        NftRoot(adr).startSelling();
    }

    // Function with predefined name which is used to replace custom replay protection.
    function afterSignatureCheck(TvmSlice body, TvmCell message) private inline returns (TvmSlice) {
        body.decode(uint64); 
        uint32 expireAt = body.decode(uint32);

        require(expireAt >= now, 101);
        uint hash = tvm.hash(message);
        require(!messages.exists(hash), 102);
        messages[hash] = expireAt;
        return body;
    }

    function gc() private {
        optional(uint256, uint32) res = messages.min();
        uint8 counter = 0;
        while (res.hasValue() && counter < MAX_CLEANUP_MSGS) {
            (uint256 msgHash, uint32 expireAt) = res.get();
            if (expireAt < now) {
                delete messages[msgHash];
            }
            counter++;
            res = messages.next(msgHash);
        }
    }
}