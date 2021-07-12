pragma AbiHeader pubkey;
pragma ton-solidity >=0.30.0;

contract AnonymousVote {
// Error codes:
// 100 - message sender is not contract owner
// 101 - voters_set is empty
// 102 - voter_set is longer than MAX_VOTERS
// 103 - num_options is zero
// 104 - num_options is greater than 2^32
// 105 - proof size is not PROOF_SIZE
// 106 - you shouldn't sign anonymous vote message, idiot.
// 107 - voter secret's hash must not be zero
// 108 - invalid proof for supplied parameters
// 109 - this anonymous id has already voted

    bytes constant m_vkey = hex"c868a21796ee22c3818c36318ce210299bc9ea9e030a5cd34031688688217808e719842f98ab0aaedf57415a5d93760e18a142e32322ecebd466109f89300f042d31595c729d58864a67c6ff1cdf62c1b62e29107e67cc786b006e84fceed11233348dd593e447766ee57ac580d1e2d8a757fc5a244977d9801bd1b3add5a734db0c9720d71b046362626bde3b22e011d94ac87530c3fcd3804bb95a675585645ce2b22e9341cb337cb4242260c20dcea2c8aa53ac0dee116adbc7d9c708af02ef09ae4b00998993a2bf81f401ff6a7d18718e76046126ec0d58978a582287882818e07f353579d241bf721d5367ee0e790251b191b2d1621ca5f67646ed275752b08dac0a0892b9cc155c96af967f1bd3ca786337d9fe4e33cd00a0660ccc08b78cd6b986c41159d19d1300e8720f30ad2ddab36b2ed9de8e48996a3679d4cbafe3fc320d438b0567d874630683d901caf1e151e133340f3f6c2488d26ae4f6eadb52e006cda745b6fece08e62dc245838e7d25a802017d195873d1fdeec0002c3290c3baa569f5ad7940bf6b3d67ad22f0d700b16d3f0c0a9416cd995203a0154e91e24f1cc81dc8657c6de6838008c850460c8a718b4245938885bdf036516c3b5249a9b214576ec4cd1b0c76ced0bcf0bee4da31cccbbd2057ad0548200a73289bbe9b0bac46951aae3e5c4ff0aad3697c5580a7a8816e4fceacd47da6613786322215cf46470b7a5a0220283e113abb99120de123c5c51aa43b8d1a39fdaae8293395c2ddb5be1eecc5fd21b683a0175747b39873ef8757707447561219ad2e3d52525724b4a38512f349e892b6063f6e620a317ff291d2cd773813d4109fdd33d02db4dd4aee4a8dbad7864cc4099cf4c3228f2d8b07b36ee82acad0afc46aca0a3bddbdf8819356de6e0ab8b330a44d412b9e070ceeca18fc0ac3c035b4f34fca484c6b497923b022ef40439dd88c46144c4079a1bea8a4c15e2a83a03b4142d5f1cf3d4b8f4c6cda76b2a3141744088a0951732e2cf6b54a6dfcabcd46d5a3886a6035d6f6389629c1ae6ce1d834e08cb97b83278e6f73c33f47f9f68ad43919d4af521c97dfa62e42cc0520adb88bb50ace2d7edae0dc777d7fed090abc0d07fd636e4079f079bd4ee7b4d50d000000000000000100000002000000030000000400000005000000060000000700000008000000090000000a0000000b0000000c000000a1dd77d5b17756d2609c05c39834905e2668a501e8855d31463b78009d2fa07b28d009d1668288cf7c8ed81038263981a9814b552c4d0471403287bb66993ef20e74148721a29fed7ff3a5a7e7dd1ba1d89627b5570bd3c6fcf5de0860cfa748a3526f7033c1f6c7477197c60bbb88a79f2f5b47bfb433f31be0bcfc445373331ed3e4fea8c59c0d1e10e67e15895225921289b0502f748e9cb5a94d64eefe489fad698afdf39f2e8b2598d4a6adb8ac17d25c669a980fcfaebed5f11cc911d9b6d16f214fedeb732e0305943f1cbe6b88f8ce6b21023684a99b052a7462fa6f6714b2ff07d03ffbf188fb106e21ad41b6d4dd657b05462d1d722da61988ad3684e9a52bd2cb686cfcf53f69d96fe3ef458e49c245bc7fccf68e1e5340d4cbf98fbfe88f2cb626b7caf22f9a95ce06f5365c0bf956fb62acdf1c1734bc3b3b02aa433867844c2151659dd87f0b64854686beeb86ad2d7466845a3f912268b4f84cb0b192eb06966e9db558611511bd4bb4ab81c16eaf8c8b9096a20d05b859c38a0ab75f930190e8eae40c2fa7e1bda316eb27b08e5cbb47b53ae370b63cb6c3916c5b4b0bec4ed7c94f2648b4b44175b3f84b66f712c44e8db79c1fe32efe2e2f4f24d8fe720c717c6f41d6095d935945d2dc9721eab9a257b7abe9d70fa0dd879581848c5e8f4237f70a0d030d4afeb45891c1e7391c5ea262114d8ccb53c19108a54f6ef4f75869122c9e93eb0e2a804863653d3cce65ead20a259c4fe1013dd74038bc4a5beec19dd476e0ff99cd421b6c5f9486b2d3cca304facdab2732ac4e679223d549591b355afc28b4baa6d79a0c2845050e85fc6b224f07b2c9a60972db44b2983e32f0585328eadc464f0d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    uint8 constant PROOF_SIZE = 192;
    uint8 constant MAX_VOTERS = 10;
    uint32 constant PI_SIZE = 13;
    mapping(uint256 => uint32) m_votes;
    uint256[] m_voters_set;

    constructor(uint256[] voters_set, uint64 num_options) public {
        require(tvm.pubkey() != 0, 100);
        require(msg.pubkey() == tvm.pubkey(), 100);
        require(voters_set.length > 0, 101);
        require(voters_set.length <= MAX_VOTERS, 102);
        require(num_options >0, 103);
        require(num_options <= 2<<32, 104);
        tvm.accept();
        uint256 len = voters_set.length;
        for(uint256 i=0; i<len; ++i) {
            require(voters_set[i] != 0, 107);
            m_voters_set.push(voters_set[i]);
        }
        for(uint256 i=len; i<MAX_VOTERS; ++i) {
            m_voters_set.push(0);
        }
    }

    function vote(bytes proof,
                    uint32 vote_choice,
                    uint256 signed_vote,
                    uint256 anonymous_id) public {
        require(msg.pubkey() == 0 ,106);
        require(proof.length == PROOF_SIZE, 105);
        require(!m_votes.exists(anonymous_id), 109);
        tvm.accept();
        string blob_str = proof;
        blob_str.append(serialize_primary_input(vote_choice, signed_vote, anonymous_id));
        blob_str.append(m_vkey);
        require(tvm.vergrth16(blob_str), 108);
        m_votes[anonymous_id] = vote_choice;
    }

    function get_vote_set() public view returns (uint256[]) {
        return m_voters_set;
    }

    function get_results() public view returns (mapping(uint32 => uint64) results){
        for((, uint32 vote_choice) : m_votes) {
            results[vote_choice]++;
        }
    }

    function get_vote(uint256 anonymous_id) public view returns (bool exists, uint32 vote_choice) {
        exists = m_votes.exists(anonymous_id);
        vote_choice = m_votes[anonymous_id];
    }

    function serialize_primary_input(uint32 vote_choice,
                                     uint256 signed_vote,
                                     uint256 anonymous_id) internal inline view returns(bytes) {
        string blob_str=(encode_little_endian(PI_SIZE,4));
        for(uint256 voter : m_voters_set) {
            blob_str.append(uint256_to_bytes(voter));
        }
        blob_str.append(encode_little_endian(uint256(vote_choice), 32));
        blob_str.append(uint256_to_bytes(signed_vote));
        blob_str.append(uint256_to_bytes(anonymous_id));
        return blob_str;
    }

    function encode_little_endian(uint256 number, uint32 bytes_size) internal pure returns (bytes){
        TvmBuilder ref_builder;
        for(uint32 i=0; i<bytes_size; ++i) {
            ref_builder.store(byte(uint8(number & 0xFF)));
            number>>=8;
        }
        TvmBuilder builder;
        builder.storeRef(ref_builder.toCell());
        return builder.toSlice().decode(bytes);
    }

    function uint256_to_bytes(uint256 number) internal pure returns (bytes){
        TvmBuilder ref_builder;
        ref_builder.store(bytes32(number));
        TvmBuilder builder;
        builder.storeRef(ref_builder.toCell());
        return builder.toSlice().decode(bytes);
    }
}