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

    bytes constant m_vkey = hex"1484683079777388135d5f3e77c88d32bbc719e1d56d5af2cfdf5163ba0e06089651c33a3561f63f528abe74697aa602d240c423c2c1ab95f15a2e564f5771b005ac12ddae361d8f6d4f72ade3e9b035ec753c848fdff9f06f6c4b09471db102b870a7f759686f256af9df646062ccceb2b3122deb9cf58d6e2cfb0dc21a855296f44b716e46602f3b98c6fd792800147f253b0c7455216dfe112498c75876c0ebc45ecca655406c5acbdaaacf1cef8b7f63b068e928e6f6f09c21a8f467e4126e8f73aae0762d91749a62bfd71a35b2fdac5533a5beeb0e8b747fd8085384f3b7a686a41b40614121a20f48c464ba018cada9ff3a8c526d37cc67e277ca67d4567f5ce56bb01409e934afac2d165598406319383b53abd0dfab4d28be70da16bf169863fedcd5be20624b5efc0c134f56a0e00c236a46af08888edd391fc220bb10e8d2659f6a895991ecffd6ae8513b607de652e9313ffc2830a147ef20f3c343a4dca4689301ed59a72bc48ec5d24b73a261abaac983cedc66bfd24c9de190f130537ae9eb69756322737da895d2906418aba502b42a84bef2a8470684675cc15d5a10a147f178855e586d6fab9112613efc4cd77a8548cd5b1655dd05b672c57a06db52e8b9575ff9e6c2470341447a33004f31c0c3e3d00505cd4d2051837875dab4c6107da669c4cb7f3f460b2570672bcdf2015527fa302efb3ea35add3f1a2aad99d478d9ea2d35972789008d8bba0940ab80b59bba8559af5f515e17b9abf092548526897f4e1f1a9db6bb42db07e42d96c64e2f7a7c19f43854f16a93f3fd870f927fde36eaf68d1f05fd8b00dc4dfaf08382ba923ae4bfa94a9fc0e0ae72083f6f7fb89ade1c193d0343113fd31fd3a0df29667bc8761b11807bb5f5c5f035ff2e44ba96970cf495183bdaa1163a27a4a0def3ffebc219ffb5f9397d6a8d10dec52177f5a568e96a9fab8daba24701bb7039726938b54f76afcae48f9f395f6df1cd77c6603d44201ddc808fd26237c2bcaea93adecd127c31b659e6af05ba42209c5283f793ae1b61e39bcf88ed3cb1b666c8df865ce524345b5929e46cc24b39f61e0d9afd7ef988da395918b7ecba14c727a02d164909a0283a872483dffd49fa567f42ca9c74bf3980d000000000000000100000002000000030000000400000005000000060000000700000008000000090000000a0000000b0000000c000000a55d4e8444098c6b20e20ba2bae3f060bec63d81bb78364260334993923e593640931ef71f4b3199edc969b3d5d97e5ead4df4b1bbddd88888385502887b7c1bd4c89950c34e6a1a79b98c6298330f65bed0f6550251b2052a8473a63c4949db991173254a83722d228ae78f0375df50b77f5e891154c4fab60c9c2b58ab875b490b99361620b155abe0343ef5c327808147f1a583f67bb908328be8d808da3ce69aae29b60c38a7f9f0f842a6a202283b0bde5c97076f1c149331257fdf34fb98392be090db78ea5a8390dbd7fe821403957521437825d823bab06b2ed52a4290c8b211bb513528186f05222c7e040499ac04f30c1d190718cf5a1a41d0a046d14ff2181d790df8ee8d391ba242ec5d8ae0e7dfd98f18495650738be0c1347989312acf08c7dc49a68b9af07e8e0f8c2d43d74954bed3051167e2c134287a29121f620b31cfc13089ae03d1de60d228a43ace3ccb3ac0428cdd369d4cc19257db270ff0fe1ea6e2b7f49e5019134be3a8b9941f1465aca142b0821d69553ff99439233b441d042f19eab2c7114d96c88f47e1d400dfa81dc47c9c74bc2b14c1b1f6e5f9e1ddb6e6fff09440b17fdb5794d0f91fa428a944e88b565b7ac08f567888a3ae6faa4f36885a7776c6c613cbb15e820d2c616f26815f8f593fcfe32698b71ccc580e1a77124eabab531d6c6e35812d0134ada7d4c343d07a8ac7e32a92c73d1a542635f53f881003b0f527c0a41d1db84611deb044d2f1dbeafa1b1b09fbeba15f3cc90dfcdb4d1ac0d138b4210c95c9c0fd81a7c5da24568008fce694ee3585b5bdf262ea78fc1872be10324255f786f1c96e664acb827dc679b34313181ab821fa8228f1a8432157bd22ad0d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

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